# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of stackBrowserAgent seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities by:

1. **Email**: Send details to the repository maintainers (see GitHub profile)
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/stackconsult/stackBrowserAgent/security/advisories/new) feature

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Suggested fix (if you have one)
- Your contact information for follow-up

### Response Timeline

- **Acknowledgment**: Within 48 hours of submission
- **Initial Assessment**: Within 5 business days
- **Status Update**: Every 7 days until resolved
- **Fix Deployment**: As soon as possible based on severity

### Severity Levels

We classify vulnerabilities using the following levels:

| Severity | Response Time | Description |
|----------|---------------|-------------|
| **Critical** | 24 hours | Remote code execution, authentication bypass, data breach |
| **High** | 72 hours | Privilege escalation, significant data exposure |
| **Medium** | 7 days | XSS, CSRF, information disclosure |
| **Low** | 30 days | Minor issues with limited impact |

## Security Best Practices

### For Users

1. **JWT Secret**
   - Always use a strong, random JWT secret in production
   - Never commit `.env` files to version control
   - Rotate secrets regularly (at least every 90 days)
   - Use at least 32 characters for JWT_SECRET

   Generate a secure secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS**
   - Always use HTTPS in production
   - Never transmit JWT tokens over HTTP
   - Use TLS 1.2 or higher

3. **Rate Limiting**
   - Keep default rate limits or adjust based on your needs
   - Monitor for unusual traffic patterns
   - Consider IP whitelisting for trusted clients

4. **Environment Variables**
   - Use secure secret management (AWS Secrets Manager, HashiCorp Vault)
   - Never log environment variables
   - Restrict access to production environment variables

5. **Dependencies**
   - Regularly update dependencies: `npm update`
   - Run security audits: `npm audit`
   - Use `npm audit fix` to automatically fix vulnerabilities
   - Monitor for security advisories

6. **Access Control**
   - Implement proper role-based access control (RBAC)
   - Use principle of least privilege
   - Regularly review and revoke unused tokens
   - Implement token expiration policies

### For Developers

1. **Code Review**
   - All code changes must be reviewed before merging
   - Look for security vulnerabilities in PR reviews
   - Use automated security scanning tools

2. **Testing**
   - Write security-focused tests
   - Test authentication and authorization logic
   - Validate input sanitization
   - Test rate limiting effectiveness

3. **Secure Coding**
   - Validate all user inputs
   - Use parameterized queries (when using databases)
   - Avoid eval() and similar dangerous functions
   - Keep dependencies up to date

4. **Logging**
   - Log security events (failed auth attempts, rate limit hits)
   - Never log sensitive data (passwords, tokens, PII)
   - Implement log rotation and retention policies
   - Monitor logs for suspicious activity

## Known Security Considerations

### Current Limitations

1. **Token Revocation**
   - JWTs cannot be revoked before expiration
   - Mitigation: Use short expiration times (24h default)
   - Future: Implement token blacklisting with Redis

2. **Rate Limiting**
   - In-memory rate limiting doesn't work across multiple instances
   - Mitigation: Use Redis-backed rate limiting for production
   - See: `express-rate-limit` with Redis adapter

3. **Session Management**
   - No built-in session management
   - Recommendation: Implement refresh tokens for long-lived sessions
   - See roadmap for planned features

### Security Headers

Consider adding security headers in production:

```typescript
app.use(helmet()); // Add helmet middleware
```

Recommended headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`

### CORS Configuration

The default CORS configuration allows all origins. In production:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com',
  credentials: true
}));
```

## Security Checklist

### Pre-Production

- [ ] Strong JWT_SECRET configured (minimum 32 characters)
- [ ] HTTPS enabled
- [ ] Rate limiting configured appropriately
- [ ] CORS restricted to known origins
- [ ] Security headers added (helmet)
- [ ] All dependencies updated
- [ ] Security audit passed (`npm audit`)
- [ ] Environment variables not committed to git
- [ ] Error messages don't leak sensitive information
- [ ] Logging configured (no sensitive data logged)

### Production Monitoring

- [ ] Monitor failed authentication attempts
- [ ] Track rate limit hits
- [ ] Set up alerts for unusual traffic patterns
- [ ] Regular dependency updates scheduled
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Backup and recovery procedures tested

## Disclosure Policy

When a vulnerability is fixed:

1. We will release a security patch
2. We will publish a security advisory on GitHub
3. We will credit the reporter (unless they prefer to remain anonymous)
4. We will update this document with mitigation strategies

## Security Updates

Subscribe to security updates:

- Watch the [GitHub repository](https://github.com/stackconsult/stackBrowserAgent)
- Enable GitHub security alerts
- Check CHANGELOG.md for security-related updates

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Contact

For security concerns, please contact the maintainers through:

- GitHub Security Advisory (preferred)
- Email to repository maintainers
- GitHub Discussions (for non-sensitive security questions)

---

**Thank you for helping keep stackBrowserAgent secure!**
