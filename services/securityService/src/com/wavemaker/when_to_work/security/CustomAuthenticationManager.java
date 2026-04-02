package com.wavemaker.when_to_work.security;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.wavemaker.runtime.security.AuthRequestContext;
import com.wavemaker.runtime.security.WMCustomAuthenticationManager;
import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.WMUserBuilder;

/**
 * Custom Authentication Manager that delegates authentication to the
 * external REST login API (LoginService).
 *
 * The login API URL is resolved from the application's REST service property:
 *   rest.LoginService.scheme://rest.LoginService.host/api/login
 *
 * Response field mapping:
 *  - role        → WaveMaker role  (fallback: "user" if null/empty)
 *  - displayName → WMUser.userLongName
 *  - userId      → WMUser.userId
 *  - token       → stored temporarily in customAttributes under key "loginServiceToken"
 *                  (promoted to SERVER_ONLY scope by LoginServiceTokenSuccessHandler)
 */
public class CustomAuthenticationManager implements WMCustomAuthenticationManager {

    private static final Logger logger = LoggerFactory.getLogger(CustomAuthenticationManager.class);

    /** Key used to temporarily carry the raw token through to the success handler. */
    public static final String TOKEN_ATTRIBUTE_KEY = "loginServiceToken";

    private static final String DEFAULT_ROLE = "user";

    /**
     * Login API URL resolved from LoginService REST service properties.
     * Defaults to the known base URL if properties are not explicitly overridden.
     */
    @Value("${rest.LoginService.scheme:https}://${rest.LoginService.host:when-to-work-backend.onwavemaker.com}/api/login")
    private String loginApiUrl;

    @Override
    public WMUser authenticate(AuthRequestContext authRequestContext) throws AuthenticationException {
        String username = authRequestContext.getUsername();
        String password = authRequestContext.getPassword();

        logger.info("Attempting authentication via LoginService REST API for user: {}", username);

        try {
            // Prepare the JSON request payload
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = Map.of(
                "username", username,
                "password", password
            );

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Call the external login REST API
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(loginApiUrl, requestEntity, Map.class);

            Map<?, ?> responseBody = responseEntity.getBody();

            if (responseBody == null) {
                logger.warn("Authentication failed: null response body from LoginService for user '{}'", username);
                throw new AuthenticationServiceException("Authentication service returned an empty response.");
            }

            // Evaluate the 'success' flag from the response
            Object successObj = responseBody.get("success");
            boolean success = Boolean.TRUE.equals(successObj);

            if (!success) {
                Object messageObj = responseBody.get("message");
                String message = (messageObj != null) ? messageObj.toString() : "Invalid credentials";
                logger.warn("Authentication failed for user '{}': {}", username, message);
                throw new BadCredentialsException(message);
            }

            // Map role — fall back to DEFAULT_ROLE if null/empty
            Object roleObj = responseBody.get("role");
            String resolvedRole = (roleObj != null && !roleObj.toString().trim().isEmpty())
                    ? roleObj.toString().trim()
                    : DEFAULT_ROLE;
            List<String> roles = Collections.singletonList(resolvedRole);

            // Map displayName as userLongName
            Object displayNameObj = responseBody.get("displayName");
            String displayName = (displayNameObj != null) ? displayNameObj.toString() : username;

            // Map userId (comes as Integer from JSON, convert to String)
            Object userIdObj = responseBody.get("userId");
            String userId = (userIdObj != null) ? userIdObj.toString() : username;

            // Carry the token forward temporarily via customAttributes so that
            // LoginServiceTokenSuccessHandler can promote it to SERVER_ONLY scope.
            Map<String, Object> customAttributes = new HashMap<>();
            Object tokenObj = responseBody.get("token");
            if (tokenObj != null && !tokenObj.toString().trim().isEmpty()) {
                customAttributes.put(TOKEN_ATTRIBUTE_KEY, tokenObj.toString());
                logger.debug("Token received from LoginService for user '{}'; will be stored SERVER_ONLY.", username);
            } else {
                logger.warn("No token received in LoginService response for user '{}'.", username);
            }

            logger.info("Authentication successful for user '{}' — role: '{}', displayName: '{}', userId: '{}'",
                    username, resolvedRole, displayName, userId);

            // Build and return the WMUser using the recommended WMUserBuilder
            return WMUserBuilder.create(username, roles)
                    .setUserId(userId)
                    .setUserLongName(displayName)
                    .setCustomAttributes(customAttributes)
                    .build();

        } catch (AuthenticationException e) {
            // Re-throw Spring Security exceptions as-is
            throw e;
        } catch (HttpClientErrorException e) {
            logger.warn("HTTP error during authentication for user '{}': {} - {}",
                    username, e.getStatusCode(), e.getMessage());
            throw new BadCredentialsException("Authentication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error during authentication for user '{}': {}", username, e.getMessage(), e);
            throw new AuthenticationServiceException(
                    "Authentication failed due to an internal error: " + e.getMessage(), e);
        }
    }
}
