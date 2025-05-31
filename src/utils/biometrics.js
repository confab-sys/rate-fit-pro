// Utility functions for handling biometric authentication
export const registerBiometric = async (email) => {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);    // Create credential options
    const createCredentialOptions = {
      publicKey: {
        challenge,
        rp: {
          name: "Supervisor Portal",
          id: location.hostname === "" ? "localhost" : location.hostname
        },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [{
          type: "public-key",
          alg: -7 // "ES256" as registered in the IANA COSE Algorithms registry
        }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          userVerification: "required"
        },
        timeout: 60000,
      }
    };

    // Create credentials
    const credential = await navigator.credentials.create(createCredentialOptions);
    return credential;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    throw error;
  }
};

export const verifyBiometric = async (email) => {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);    // Create credential options for authentication
    const getCredentialOptions = {
      publicKey: {
        challenge,
        rpId: location.hostname === "" ? "localhost" : location.hostname,
        userVerification: "required",
        timeout: 60000
      }
    };

    // Get credentials
    const assertion = await navigator.credentials.get(getCredentialOptions);
    return assertion;
  } catch (error) {
    console.error('Biometric verification failed:', error);
    throw error;
  }
};
