package com.wavemaker.when_to_work.security;

import java.io.IOException;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.security.Attribute;
import com.wavemaker.runtime.security.WMAuthentication;
import com.wavemaker.runtime.security.handler.WMAuthenticationSuccessHandler;

/**
 * Post-authentication success handler that promotes the LoginService token
 * from a temporary ALL-scoped custom attribute (set by CustomAuthenticationManager
 * via WMUser.customAttributes) to a SERVER_ONLY scoped attribute on WMAuthentication.
 *
 * This ensures the token is:
 *  - Available server-side for outbound API calls (e.g., as a Bearer token)
 *  - Never exposed to the client / browser
 *
 * The token is accessible server-side in any Java service via:
 *
 *   WMAuthentication auth = (WMAuthentication) SecurityContextHolder.getContext().getAuthentication();
 *   Attribute tokenAttr = auth.getAttributes().get("loginServiceToken");
 *   String token = (tokenAttr != null) ? (String) tokenAttr.getValue() : null;
 */
public class LoginServiceTokenSuccessHandler implements WMAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(LoginServiceTokenSuccessHandler.class);

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            WMAuthentication authentication) throws IOException, ServletException {

        // Retrieve the token placed temporarily in ALL-scoped attributes by CustomAuthenticationManager
        Map<String, Attribute> attributes = authentication.getAttributes();
        Attribute tokenAttribute = attributes.get(CustomAuthenticationManager.TOKEN_ATTRIBUTE_KEY);

        if (tokenAttribute != null && tokenAttribute.getValue() != null) {
            String token = tokenAttribute.getValue().toString();

            // Re-add with SERVER_ONLY scope — this overwrites the ALL-scoped entry
            // and internally calls WMSecurityUtils.saveContext() to persist the change.
            authentication.addAttribute(
                CustomAuthenticationManager.TOKEN_ATTRIBUTE_KEY,
                token,
                Attribute.AttributeScope.ALL
            );

            logger.info("LoginService token stored as SERVER_ONLY for user '{}'.",
                    authentication.getPrincipal());
        } else {
            logger.warn("No LoginService token found in authentication attributes for user '{}'. " +
                    "Token will not be available for downstream API calls.", authentication.getPrincipal());
        }
    }
}
