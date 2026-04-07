package com.wavemaker.when_to_work.rest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.wavemaker.runtime.rest.processor.request.AbstractHttpRequestProcessor;
import com.wavemaker.runtime.rest.processor.request.HttpRequestProcessorContext;
import com.wavemaker.runtime.security.Attribute;
import com.wavemaker.runtime.security.WMAuthentication;

/**
 * HTTP request processor that injects a Bearer token into the Authorization header
 * for every proxied outgoing REST API call.
 *
 * The token is retrieved from the current user's SERVER_ONLY WMAuthentication attribute
 * stored under the key {@code "loginServiceToken"} — set by {@code LoginServiceTokenSuccessHandler}
 * after a successful login via the external LoginService REST API.
 *
 * If the user is not authenticated or the token is absent, the request is forwarded
 * unchanged (no exception is thrown).
 */
public class SecurityTokenRequestProcessor extends AbstractHttpRequestProcessor {

    private static final Logger logger = LoggerFactory.getLogger(SecurityTokenRequestProcessor.class);

    /** Attribute key under which the LoginService Bearer token is stored (SERVER_ONLY scope). */
    private static final String TOKEN_ATTRIBUTE_KEY = "loginServiceToken";

    @Override
    protected void doProcess(HttpRequestProcessorContext context) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            logger.warn("SecurityTokenRequestProcessor: No authentication found in SecurityContext. "
                    + "Skipping Authorization header injection.");
            return;
        }

        if (!(authentication instanceof WMAuthentication wmAuth)) {
            logger.warn("SecurityTokenRequestProcessor: Authentication is not a WMAuthentication instance (type: {}). "
                    + "Skipping Authorization header injection.", authentication.getClass().getName());
            return;
        }

        Attribute tokenAttribute = wmAuth.getAttributes().get(TOKEN_ATTRIBUTE_KEY);

        if (tokenAttribute == null || tokenAttribute.getValue() == null) {
            logger.warn("SecurityTokenRequestProcessor: '{}' attribute not found or null for user '{}'. "
                    + "Skipping Authorization header injection.",
                    TOKEN_ATTRIBUTE_KEY, wmAuth.getPrincipal());
            return;
        }

        String token = tokenAttribute.getValue().toString();

        if (token.trim().isEmpty()) {
            logger.warn("SecurityTokenRequestProcessor: '{}' attribute is blank for user '{}'. "
                    + "Skipping Authorization header injection.",
                    TOKEN_ATTRIBUTE_KEY, wmAuth.getPrincipal());
            return;
        }

        HttpHeaders httpHeaders = context.getHttpRequestData().getHttpHeaders();
        httpHeaders.set(HttpHeaders.AUTHORIZATION, "Bearer " + token);

        logger.debug("SecurityTokenRequestProcessor: Injected Authorization header for user '{}'.",
                wmAuth.getPrincipal());
    }
}
