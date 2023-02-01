import { IntlProvider } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';

export default connectToStores(
  IntlProvider,
  ['PreferencesStore'],
  (context, props) => {
    const language = context.getStore('PreferencesStore').getLanguage();

    return {
      locale: language,
      messages: props.translations[language],
    };
  },
);
