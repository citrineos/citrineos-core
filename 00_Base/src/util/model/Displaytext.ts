import {Language, language} from "./Language";
import {shortText, ShortText} from "./ShortText";

export class Displaytext {

  language: Language;
  text: ShortText;

  private constructor({language: lang, text: text}: {language: string, text: string}) {
    this.language = language(lang);
    this.text = shortText(text);
  }

  public static displayText({language, text}: {language: string, text: string}): Displaytext {
    return new Displaytext({language, text});
  }
}
