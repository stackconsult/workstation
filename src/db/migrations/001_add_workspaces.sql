-- Phase 6: Workspaces table
-- Multi-tenant workspace support with generic defaults

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Generic credentials (before activation)
  generic_username VARCHAR(100) UNIQUE,
  generic_password_hash VARCHAR(255),
  is_activated BOOLEAN DEFAULT false,
  activated_at TIMESTAMP,
  
  -- Slack integration
  slack_team_id VARCHAR(100),
  slack_access_token TEXT,
  slack_bot_token TEXT,
  slack_webhook_url TEXT,
  slack_channel VARCHAR(100),
  
  -- Status and settings
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Workspace members (for multi-user workspaces)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(workspace_id, user_id)
);

-- Workspace invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'microsoft', 'slack')),
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  profile_photo TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  raw_profile JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_activated ON workspaces(is_activated);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- Trigger for workspace updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert 20 generic workspaces with hashed password 'workspace123'
DO $$
DECLARE
  hashed_password VARCHAR(255);
BEGIN
  -- Generate bcrypt hash for 'workspace123' (this is a placeholder, will be properly hashed via code)
  hashed_password := '$2b$10$K8qLqz7z7z7z7z7z7z7z7uYmZPYn4YvGnqGRqPCq8vPjvPjvPjvPj';
  
  INSERT INTO workspaces (name, slug, generic_username, generic_password_hash, description, status) VALUES
    ('Workspace Alpha', 'workspace-alpha', 'ws_alpha_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Beta', 'workspace-beta', 'ws_beta_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Gamma', 'workspace-gamma', 'ws_gamma_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Delta', 'workspace-delta', 'ws_delta_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Epsilon', 'workspace-epsilon', 'ws_epsilon_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Zeta', 'workspace-zeta', 'ws_zeta_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Eta', 'workspace-eta', 'ws_eta_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Theta', 'workspace-theta', 'ws_theta_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Iota', 'workspace-iota', 'ws_iota_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Kappa', 'workspace-kappa', 'ws_kappa_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Lambda', 'workspace-lambda', 'ws_lambda_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Mu', 'workspace-mu', 'ws_mu_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Nu', 'workspace-nu', 'ws_nu_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Xi', 'workspace-xi', 'ws_xi_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Omicron', 'workspace-omicron', 'ws_omicron_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Pi', 'workspace-pi', 'ws_pi_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Rho', 'workspace-rho', 'ws_rho_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Sigma', 'workspace-sigma', 'ws_sigma_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Tau', 'workspace-tau', 'ws_tau_user', hashed_password, 'Generic workspace for initial setup', 'active'),
    ('Workspace Upsilon', 'workspace-upsilon', 'ws_upsilon_user', hashed_password, 'Generic workspace for initial setup', 'active')
  ON CONFLICT (slug) DO NOTHING;
END $$;
