/**
 * Compresses and resizes an image file to a lightweight data URL thumbnail.
 * Max dimension 300x300, JPEG quality 0.8 (~30-50KB).
 */
export const resizeImage = (file, maxWidth = 300, maxHeight = 300) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image."));
    }

    // Limit original file size to 10MB to avoid freezing
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error("Image size should be less than 10MB."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Generates an SVG or styled avatar with initials when no photo is provided.
 */
export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
