const branchInfoFromDetails = (details: unknown) => {
  if (!details || typeof details !== "object") {
    return {
      name: null as string | null,
      latitude: null as number | null,
      longitude: null as number | null,
    };
  }
  const obj = details as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name : null;
  const lat = typeof obj.latitude === "number" ? obj.latitude : null;
  const lng = typeof obj.longitude === "number" ? obj.longitude : null;
  return { name, latitude: lat, longitude: lng };
};

export const getUserBranchOrThrow = (branchDetails: unknown) => {
  const branch = branchInfoFromDetails(branchDetails);
  if (!branch.name || branch.latitude == null || branch.longitude == null) {
    const err = new Error(
      "Please select your branch before creating a listing"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  return branch as { name: string; latitude: number; longitude: number };
};

export const NEARBY_LISTINGS_RADIUS_KM = 5;

export const toNum = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (
    v &&
    typeof v === "object" &&
    "toNumber" in v &&
    typeof (v as { toNumber: () => number }).toNumber === "function"
  ) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
};
