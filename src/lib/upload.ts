import { auth } from "./firebase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Compresses an image file and returns a Blob
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Compresses and uploads an image to backend proxy
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const compressedBlob = await compressImage(file);
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required for upload");

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("image", compressedBlob, "image.webp");

    const res = await fetch(`${BACKEND_URL}/upload-image`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Upload failed");
    }

    const { url } = await res.json();
    return url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload image", { cause: error instanceof Error ? error : new Error(String(error)) });
  }
};
