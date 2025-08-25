# 🚨 SECURITY CLEANUP CHECKLIST 🚨

## IMMEDIATE ACTIONS REQUIRED

Your repository contains exposed secrets and sensitive information that must be removed immediately.

### 🔴 CRITICAL SECURITY ISSUES FOUND

1. **Exposed Supabase JWT Token** in `services/backend/env.development`
2. **Real Supabase Project URL** exposed in multiple files
3. **Environment files with secrets** committed to repository
4. **Built frontend files** containing secrets in `services/frontend/dist/`

### 🚨 STEP 1: Remove Sensitive Files from Git History

**WARNING: These commands will rewrite git history. Make sure you have a backup!**

```bash
# Remove sensitive files from git history completely
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch services/backend/env.development' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch services/backend/env.production' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch services/backend/supabase/.temp/project-ref' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch services/backend/supabase/.temp/pooler-url' \
  --prune-empty --tag-name-filter cat -- --all

# Remove the entire dist folder from history
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch services/frontend/dist' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up the rewritten history
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 🚨 STEP 2: Force Push to Remote (DANGEROUS!)

```bash
# Force push to overwrite remote history
git push origin --force --all
git push origin --force --tags
```

**⚠️ WARNING: This will overwrite the remote repository history. All collaborators must re-clone the repository.**

### 🚨 STEP 3: Regenerate All Secrets

1. **Supabase:**

   - Go to your Supabase project dashboard
   - Regenerate the service role key
   - Regenerate the anon key
   - Update your local environment files

2. **Other APIs:**
   - Regenerate OpenAI API key
   - Regenerate Cloudinary API keys
   - Regenerate any other API keys

### 🚨 STEP 4: Update Local Environment Files

```bash
# Remove existing environment files
rm services/backend/env.development
rm services/backend/env.production

# Copy example files and update with new secrets
cp services/backend/env.development.example services/backend/env.development
cp services/backend/env.production.example services/backend/env.production

# Edit these files with your NEW secrets (not the old ones!)
```

### 🚨 STEP 5: Verify No Secrets Are Committed

```bash
# Search for any remaining secrets
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
grep -r "xbdjfswbbekmtagjrmup" .
grep -r "your-api-key" .
grep -r "your-secret" .
```

## PREVENTION MEASURES

### ✅ Updated .gitignore

- Added comprehensive patterns for secrets
- Added Supabase-specific ignores
- Added patterns for JWT tokens and API keys

### ✅ Security Best Practices

1. **Never commit .env files**
2. **Use .env.example files only**
3. **Rotate secrets regularly**
4. **Use environment variables in production**
5. **Regular security audits**

### ✅ Pre-commit Hooks (Recommended)

Install pre-commit hooks to prevent future commits of secrets:

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Install the hooks
pre-commit install
```

## VERIFICATION CHECKLIST

- [ ] Sensitive files removed from git history
- [ ] Remote repository updated
- [ ] All secrets regenerated
- [ ] Local environment files updated
- [ ] No secrets found in repository
- [ ] .gitignore updated
- [ ] Team members notified to re-clone
- [ ] Pre-commit hooks installed (optional)

## EMERGENCY CONTACTS

If you need immediate assistance:

1. **Supabase Support** - For database security
2. **GitHub Security** - For repository security
3. **Your Security Team** - For internal security review

## REMINDER

**NEVER COMMIT SECRETS TO VERSION CONTROL**
**ALWAYS USE ENVIRONMENT VARIABLES**
**REGULARLY ROTATE YOUR SECRETS**

---

_This checklist was generated after detecting exposed secrets in your repository. Follow all steps immediately to secure your application._
