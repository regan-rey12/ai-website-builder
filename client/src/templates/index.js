import businessSchema from './business/schema';
import restaurantSchema from './restaurant/schema';
import portfolioSchema from './portfolio/schema';
import BusinessTemplate from './business';
import RestaurantTemplate from './restaurant';
import PortfolioTemplate from './portfolio';

export const TEMPLATE_REGISTRY = {
  business: businessSchema,
  restaurant: restaurantSchema,
  portfolio: portfolioSchema,
};

export const TEMPLATE_COMPONENTS = {
  business: BusinessTemplate,
  restaurant: RestaurantTemplate,
  portfolio: PortfolioTemplate,
};

export const TEMPLATE_LIST = Object.values(TEMPLATE_REGISTRY);

export function getTemplateSchema(templateId) {
  return TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.business;
}

export function getTemplateComponent(templateId) {
  return TEMPLATE_COMPONENTS[templateId] || TEMPLATE_COMPONENTS.business;
}

export default TEMPLATE_REGISTRY;
