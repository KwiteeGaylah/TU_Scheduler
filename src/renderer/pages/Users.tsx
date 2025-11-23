import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Users() {
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  const handleGenerateRecoveryKey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await window.electronAPI.backup.generateRecoveryKey();
      
      if (response.success && response.data) {
        setGeneratedKey(response.data.key);
        setShowGenerateModal(true);
        setSuccess('Recovery key generated successfully! Please save it in a secure location.');
      } else {
        setError(response.message || 'Failed to generate recovery key');
      }
    } catch (err) {
      setError('Error generating recovery key');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRecoveryKey = () => {
    const element = document.createElement('a');
    const file = new Blob([`TU SCHEDULER PASSWORD RECOVERY KEY\n\nUsername: ${user?.username || 'admin'}\nRecovery Key: ${generatedKey}\n\nKEEP THIS KEY SAFE!\n\nThis key can be used to reset your password if you forget it.\nStore it in a secure location separate from your computer.\n\nGenerated: ${new Date().toLocaleString()}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'TU_Scheduler_Recovery_Key.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Password Recovery Setup</h1>
        <p className="text-gray-600">Generate and manage your password recovery key</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Generate Recovery Key Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--dark-spruce)' }}>
          <span className="text-2xl">🔑</span>
          Generate Recovery Key
        </h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>What is a Recovery Key?</strong>
          </p>
          <p className="text-sm text-blue-700">
            A recovery key is a special code that allows you to reset your password if you forget it.
            Generate one now and store it in a safe place (USB drive, printed copy, password manager).
          </p>
        </div>

        <button
          onClick={handleGenerateRecoveryKey}
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--dark-spruce)' }}
        >
          {loading ? 'Generating...' : '🔑 Generate New Recovery Key'}
        </button>
      </div>

      {/* Info about password reset */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--dark-spruce)' }}>
          <span className="text-2xl">🔓</span>
          Forgot Your Password?
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Password reset is available on the login page.</strong>
          </p>
          <p className="text-sm text-blue-700 mb-2">
            If you forget your password, you can reset it from the login screen using your recovery key:
          </p>
          <ol className="text-sm text-blue-700 space-y-1 ml-4">
            <li>1. Go to the login page (log out if currently logged in)</li>
            <li>2. Click "Forgot Password? Use Recovery Key"</li>
            <li>3. Enter your recovery key and new password</li>
            <li>4. Log in with your new password</li>
          </ol>
          <p className="text-sm text-blue-800 mt-3 font-semibold">
            💡 Make sure to generate and save your recovery key before you need it!
          </p>
        </div>
      </div>

      {/* Recovery Key Display Modal */}
      {showGenerateModal && generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--dark-spruce)' }}>
              <span className="text-3xl">🔑</span>
              Your Recovery Key
            </h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm font-bold text-red-800 mb-2">⚠️ CRITICAL - READ CAREFULLY</p>
              <p className="text-sm text-red-700">
                This is the ONLY time you will see this recovery key. Save it NOW in a secure location.
                Without this key, you cannot reset your password if you forget it!
              </p>
            </div>

            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">YOUR RECOVERY KEY:</p>
              <p className="text-2xl font-mono font-bold text-center break-all" style={{ color: 'var(--dark-spruce)' }}>
                {generatedKey}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 How to Store Your Recovery Key:</p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Download it as a text file (recommended)</li>
                <li>• Print it and store in a safe place</li>
                <li>• Save it in a password manager</li>
                <li>• Write it down and keep it secure</li>
                <li>• Store it on a USB drive</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadRecoveryKey}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--dark-spruce)' }}
              >
                💾 Download Key as File
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratedKey('');
                }}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--amber-honey)' }}
              >
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
