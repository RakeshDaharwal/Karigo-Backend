import { getActiveCategories } from "../../repositories/category.repository";

export const getCategoriesService = async () => {
  return getActiveCategories();
};
