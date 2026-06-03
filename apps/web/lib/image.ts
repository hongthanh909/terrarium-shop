/**
 * Client-side Image Compression Utility
 * Compresses large images before upload using HTML5 Canvas
 * 
 * @param file - The input File object
 * @param maxWidth - Max width of output image
 * @param maxHeight - Max height of output image
 * @param quality - Compression quality (0.0 to 1.0, e.g., 0.90 for high quality, 0.85 for standard)
 * @returns A Promise resolving to the compressed File object
 */
export const compressImage = (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.9
): Promise<File> => {
  return new Promise((resolve) => {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize if it exceeds dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to JPEG blob with high quality (0.90)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            
            // Create a new File from the blob
            const newName = file.name.substring(0, file.name.lastIndexOf('.')) + ".jpg";
            const compressedFile = new File([blob], newName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            
            console.log(
              `Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024).toFixed(2)}KB`
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        resolve(file); // Fallback
      };
    };
    reader.onerror = () => {
      resolve(file); // Fallback
    };
  });
};
