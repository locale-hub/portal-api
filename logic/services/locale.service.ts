import {Locale} from '../../data/models/locale.model';
import {LocaleRepository} from '../../data/repositories/locale.repository';

const localeRepository = new LocaleRepository();

/**
 * List all available locales
 * @return {Locale[]} List of available locales
 */
export const getLocales = async (): Promise<Locale[]> => {
  return localeRepository.findAll();
};
