export function base64ToBytes(str: string): Uint8Array {
  const binaryString = atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (const byte of bytes) {
    binaryString += String.fromCharCode(byte);
  }
  return btoa(binaryString);
}

export async function encryptData(
  secretData: string,
  encryptionKey: CryptoKey
): Promise<string> {
  try {
    const iv: Uint8Array = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent: ArrayBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      encryptionKey,
      new TextEncoder().encode(secretData)
    );

    const encryptedContentArr: Uint8Array = new Uint8Array(encryptedContent);
    const buff: Uint8Array = new Uint8Array(
      iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(iv, 0);
    buff.set(encryptedContentArr, iv.byteLength);
    const base64Buff: string = bytesToBase64(buff);
    return base64Buff;
  } catch (e) {
    console.log(`Encryption Error - ${e}`);
    throw e;
  }
}

export async function decryptData(
  encryptedData: string,
  decryptionKey: CryptoKey
): Promise<string> {
  try {
    const encryptedDataBuff: Uint8Array = base64ToBytes(encryptedData);
    const { iv, data } = parseEncryptedData(encryptedDataBuff);

    const decryptedContent: ArrayBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      decryptionKey,
      data
    );
    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.log(`Decryption Error - ${e}`);
    throw e;
  }
}

/**
 * Parses the encrypted data to extract the IV and actual encrypted content.
 *
 * @param {Uint8Array} encryptedDataBuff - The buffer containing the encrypted data.
 * @returns {{ iv: Uint8Array, data: Uint8Array }} - An object containing the IV and data.
 */
function parseEncryptedData(encryptedDataBuff: Uint8Array): {
  iv: Uint8Array;
  data: Uint8Array;
} {
  const iv: Uint8Array = encryptedDataBuff.slice(0, 12);
  const data: Uint8Array = encryptedDataBuff.slice(12);
  return { iv, data };
}

/**
 * Generates a new AES-GCM encryption key.
 *
 * @returns {Promise<CryptoKey>} - A promise that resolves to a newly generated AES-GCM encryption key.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Wraps a given CryptoKey using a password-derived key.
 *
 * @param {CryptoKey} keyToWrap - The key to be wrapped.
 * @param {string} userPassword - The password used to derive the wrapping key.
 * @returns {Promise<{ wrappedKey: Uint8Array; salt: Uint8Array }>} - An object containing the wrapped key and the salt used for key derivation.
 */
export async function wrapKeyWithPassword(
  keyToWrap: CryptoKey,
  userPassword: string
): Promise<{ wrappedKey: Uint8Array; salt: Uint8Array }> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer: Uint8Array = encoder.encode(userPassword);

    let keyMaterial: CryptoKey;
    try {
      keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
    } catch (error) {
      console.error("Error importing key material:", error);
      throw error;
    }

    // const salt: Uint8Array = window.crypto.getRandomValues(new Uint8Array(16));
    const salt: Uint8Array = generateSalt();

    let wrappingKey: CryptoKey;
    try {
      wrappingKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 250000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        false,
        ["wrapKey", "unwrapKey"]
      );
    } catch (error) {
      console.error("Error deriving wrapping key:", error);
      throw error;
    }

    let wrappedKey: ArrayBuffer;
    try {
      wrappedKey = await window.crypto.subtle.wrapKey(
        "raw",
        keyToWrap,
        wrappingKey,
        "AES-KW"
      );

      // Ensure the wrappedKey length is a multiple of 8 bytes
      if (wrappedKey.byteLength % 8 !== 0) {
        throw new Error(
          "The AES-KW output data length is invalid: not a multiple of 8 bytes"
        );
      }
    } catch (error) {
      console.error("Error wrapping key:", error);
      throw error;
    }

    return {
      wrappedKey: new Uint8Array(wrappedKey),
      salt: salt,
    };
  } catch (error) {
    console.error("Error in wrapKeyWithPassword function:", error);
    throw error;
  }
}

/**
 * Unwraps a wrapped CryptoKey using a password-derived key.
 *
 * @param {Uint8Array} wrappedKey - The wrapped key to be unwrapped.
 * @param {string} userPassword - The password used to derive the unwrapping key.
 * @param {Uint8Array} salt - The salt used during the wrapping process.
 * @returns {Promise<CryptoKey>} - The unwrapped CryptoKey.
 */
export async function unwrapKeyWithPassword(
  wrappedKey: Uint8Array,
  userPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer: Uint8Array = encoder.encode(userPassword);

    let keyMaterial: CryptoKey;
    try {
      keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
    } catch (error) {
      console.error("Error importing key material:", error);
      throw error;
    }

    let unwrappingKey: CryptoKey;
    try {
      unwrappingKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 250000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        false,
        ["wrapKey", "unwrapKey"]
      );
    } catch (error) {
      console.error("Error deriving unwrapping key:", error);
      throw error;
    }

    // Ensure the wrappedKey length is a multiple of 8 bytes
    if (wrappedKey.byteLength % 8 !== 0) {
      throw new Error(
        "The AES-KW input data length is invalid: not a multiple of 8 bytes"
      );
    }

    let unwrappedKey: CryptoKey;
    try {
      unwrappedKey = await window.crypto.subtle.unwrapKey(
        "raw",
        wrappedKey.buffer,
        unwrappingKey,
        "AES-KW",
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    } catch (error) {
      console.error("Error unwrapping key:", error);
      throw error;
    }

    return unwrappedKey;
  } catch (error) {
    console.error("Error in unwrapKeyWithPassword function:", error);
    throw error;
  }
}

export const generateSalt = (): Uint8Array =>
  window.crypto.getRandomValues(new Uint8Array(16));

/**
 * Example demonstrating how to encrypt and decrypt data using a password-derived key.
 *
 * General Approach:
 * 1. Generate a random encryption key.
 * 2. Wrap the encryption key using a password-derived key.
 * 3. Store the wrapped key and salt in local storage.
 * 4. Encrypt the data using the encryption key.
 * 5. Retrieve and unwrap the encryption key using the password.
 * 6. Decrypt the data using the unwrapped key.
 */

// async function encryptAndSaveToLocalStorage(
//   plainTextData: string,
//   userPassword: string
// ): Promise<void> {
//   const encryptionKey = await generateEncryptionKey();
//   const encryptedData = await encryptData(plainTextData, encryptionKey);
//   localStorage.setItem("encryptedData", encryptedData);

//   const { wrappedKey, salt } = await wrapKeyWithPassword(
//     encryptionKey,
//     userPassword
//   );

//   localStorage.setItem(
//     "encryptionData",
//     JSON.stringify({
//       key: btoa(String.fromCharCode(...wrappedKey)),
//       salt: btoa(String.fromCharCode(...salt)),
//     })
//   );
// }

// async function decryptFromLocalStorage(userPassword: string): Promise<string> {
//   const encryptionData = JSON.parse(localStorage.getItem("encryptionData")!);
//   const wrappedKey = new Uint8Array(
//     atob(encryptionData.key)
//       .split("")
//       .map((char) => char.charCodeAt(0))
//   );
//   const salt = new Uint8Array(
//     atob(encryptionData.salt)
//       .split("")
//       .map((char) => char.charCodeAt(0))
//   );
//   const encryptedData = localStorage.getItem("encryptedData")!;
//   const unwrappedKey = await unwrapKeyWithPassword(
//     wrappedKey,
//     userPassword,
//     salt
//   );
//   return await decryptData(encryptedData, unwrappedKey);
// }

// async function main() {
//   const plainTextData = "Hello, World!";
//   const userPassword = "securePassword123";

//   await encryptAndSaveToLocalStorage(plainTextData, userPassword);
//   const decryptedData = await decryptFromLocalStorage(userPassword);

//   console.log("Decrypted Data:", decryptedData);
// }

// main().catch(console.error);
