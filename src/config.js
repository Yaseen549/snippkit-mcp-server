import Conf from 'conf';
import crypto from 'crypto';
import os from 'os';

// Parse command line arguments for --api-key and --api-url
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--api-key' || arg === '--key') {
      result.apiKey = args[++i];
    } else if (arg.startsWith('--api-key=')) {
      result.apiKey = arg.split('=')[1];
    } else if (arg === '--api-url' || arg === '--url') {
      result.apiUrl = args[++i];
    } else if (arg.startsWith('--api-url=')) {
      result.apiUrl = arg.split('=')[1];
    }
  }
  return result;
}

const cliArgs = parseArgs();

// Helper to decrypt key from snix CLI vault if present
function getDerivedKey() {
  let user = 'user';
  try {
    user = process.env.USERNAME || process.env.USER || os.userInfo()?.username || 'user';
  } catch (e) {
    user = process.env.USERNAME || process.env.USER || 'user';
  }
  let host = 'localhost';
  try {
    host = os.hostname() || process.env.COMPUTERNAME || 'localhost';
  } catch (e) {
    host = process.env.COMPUTERNAME || 'localhost';
  }
  const cleanUser = String(user).toLowerCase().trim();
  const cleanHost = String(host).toLowerCase().trim();
  const machineSecret = `${cleanUser}_${cleanHost}_SNIPPKIT_CLI_V2_VAULT_SECRET`;
  return crypto.pbkdf2Sync(machineSecret, 'snippkit_v2_salt_secure_vault', 100000, 32, 'sha256');
}

function readCliVaultKey() {
  try {
    const cliConfig = new Conf({
      projectName: 'snippkit-cli',
      configFileMode: 0o600
    });

    const vaultData = cliConfig.get('secureVault');
    if (!vaultData || !vaultData.iv || !vaultData.authTag || !vaultData.ciphertext) {
      // Fallback to legacy plaintext if any
      const legacyKey = cliConfig.get('apiKey');
      return typeof legacyKey === 'string' ? legacyKey.trim() : null;
    }

    const key = getDerivedKey();
    const iv = Buffer.from(vaultData.iv, 'hex');
    const authTag = Buffer.from(vaultData.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(vaultData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted || null;
  } catch {
    return null;
  }
}

export function getConfig() {
  const apiKey =
    cliArgs.apiKey ||
    process.env.SNIPPKIT_API_KEY ||
    process.env.SNIPPKIT_KEY ||
    readCliVaultKey() ||
    null;

  const apiUrl = (
    cliArgs.apiUrl ||
    process.env.SNIPPKIT_API_URL ||
    process.env.SNIPPKIT_BASE_URL ||
    'https://snippkit.com'
  ).replace(/\/+$/, '');

  return { apiKey, apiUrl };
}

