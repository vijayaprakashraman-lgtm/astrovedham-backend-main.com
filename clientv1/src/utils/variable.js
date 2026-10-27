export const getAVctype = () => {
  const raw = localStorage.getItem("AVctype");
  return typeof raw === "string" ? raw.trim() : raw;
};

export const FRANCHISE_CTYPE = "frn9dad4d054c3c3379d9a0664ddd4bf44e";
