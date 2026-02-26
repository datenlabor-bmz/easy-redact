import type { RedactionSuggestion } from '@/types'

export type RegexCategory = 'phone' | 'email' | 'iban' | 'date' | 'id'

const PATTERNS: Record<RegexCategory, { pattern: RegExp; personGroup: string }> = {
  phone: {
    pattern: /(?:\+49[\s.-]?\(?\d{2,5}\)?[\s.-]?\d{3,}[\s.-]?\d{0,6}|\b0\d{2,4}[\s/.-]\d{3,}[\s/.-]?\d{0,6}\b)/g,
    personGroup: 'Telefonnummern',
  },
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    personGroup: 'E-Mail-Adressen',
  },
  iban: {
    pattern: /\b[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}\b/g,
    personGroup: 'Bankverbindungen',
  },
  date: {
    pattern: (() => {
      const MONTHS = [
        // EN
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
        // DE
        'Januar', 'Februar', 'März', 'Mai', 'Juni', 'Juli', 'Oktober', 'Dezember',
        // FR
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
        // ES
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        // PT
        'janeiro', 'fevereiro', 'março', 'maio', 'junho', 'julho', 'setembro', 'outubro', 'novembro', 'dezembro',
        // IT
        'gennaio', 'febbraio', 'aprile', 'maggio', 'giugno', 'luglio', 'settembre', 'ottobre', 'dicembre',
        // NL
        'januari', 'februari', 'maart', 'mei', 'juni', 'juli', 'augustus', 'oktober',
        // PL (nominative + genitive)
        'styczeń', 'stycznia', 'luty', 'lutego', 'marzec', 'marca', 'kwiecień', 'kwietnia', 'maja',
        'czerwiec', 'czerwca', 'lipiec', 'lipca', 'sierpień', 'sierpnia', 'wrzesień', 'września',
        'październik', 'października', 'listopad', 'listopada', 'grudzień', 'grudnia',
        // TR
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
        // RU (nominative + genitive)
        'январь', 'января', 'февраль', 'февраля', 'март', 'марта', 'апрель', 'апреля',
        'май', 'мая', 'июнь', 'июня', 'июль', 'июля', 'август', 'августа',
        'сентябрь', 'сентября', 'октябрь', 'октября', 'ноябрь', 'ноября', 'декабрь', 'декабря',
        // UK (nominative + genitive)
        'січень', 'січня', 'лютий', 'лютого', 'березень', 'березня', 'квітень', 'квітня',
        'травень', 'травня', 'червень', 'червня', 'липень', 'липня', 'серпень', 'серпня',
        'вересень', 'вересня', 'жовтень', 'жовтня', 'листопад', 'листопада', 'грудень', 'грудня',
        // CS (nominative + genitive)
        'leden', 'ledna', 'únor', 'února', 'březen', 'března', 'duben', 'dubna',
        'květen', 'května', 'červen', 'června', 'červenec', 'července', 'srpen', 'srpna',
        'září', 'říjen', 'října', 'listopad', 'listopadu', 'prosinec', 'prosince',
        // HU
        'január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus',
        'szeptember', 'október', 'november', 'december',
        // RO
        'ianuarie', 'februarie', 'martie', 'aprilie', 'iunie', 'iulie', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
        // SV
        'januari', 'februari', 'mars', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december',
        // NO/DA
        'januar', 'februar', 'marts', 'april', 'august', 'desember',
        // FI (nominative + partitive used in dates)
        'tammikuu', 'tammikuuta', 'helmikuu', 'helmikuuta', 'maaliskuu', 'maaliskuuta',
        'huhtikuu', 'huhtikuuta', 'toukokuu', 'toukokuuta', 'kesäkuu', 'kesäkuuta',
        'heinäkuu', 'heinäkuuta', 'elokuu', 'elokuuta', 'syyskuu', 'syyskuuta',
        'lokakuu', 'lokakuuta', 'marraskuu', 'marraskuuta', 'joulukuu', 'joulukuuta',
        // EL (nominative + genitive)
        'Ιανουάριος', 'Ιανουαρίου', 'Φεβρουάριος', 'Φεβρουαρίου', 'Μάρτιος', 'Μαρτίου',
        'Απρίλιος', 'Απριλίου', 'Μάιος', 'Μαΐου', 'Ιούνιος', 'Ιουνίου',
        'Ιούλιος', 'Ιουλίου', 'Αύγουστος', 'Αυγούστου', 'Σεπτέμβριος', 'Σεπτεμβρίου',
        'Οκτώβριος', 'Οκτωβρίου', 'Νοέμβριος', 'Νοεμβρίου', 'Δεκέμβριος', 'Δεκεμβρίου',
        // AR
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
        // FA (Gregorian + Solar Hijri)
        'ژانویه', 'فوریه', 'آوریل', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
        // HE
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
        // HI
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
        // BN
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
        // TH
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
        // MS/ID
        'Januari', 'Februari', 'Maret', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        // SW
        'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
        // Common abbreviations
        'Jan', 'Feb', 'Mär', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept',
        'Okt', 'Oct', 'Nov', 'Dez', 'Dec', 'Fev', 'Fév', 'Abr', 'Ago', 'Aoû', 'Set', 'Out', 'Dic', 'Ene',
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
      ]
      const m = [...new Set(MONTHS)].join('|')
      return new RegExp(
        '(?:' +
          '\\b\\d{1,2}[./\\-]\\d{1,2}[./\\-]\\d{2,4}\\b' +       // 01.01.2024, 1/1/24, 01-01-2024
          '|\\b\\d{4}[./\\-]\\d{1,2}[./\\-]\\d{1,2}\\b' +         // 2024-01-01
          '|\\b\\d{1,2}[./]\\d{2,4}\\b' +                          // 04/2019, 04.2019
          '|\\b\\d{1,2}\\.?\\s*(?:' + m + ')\\.?\\s*\\d{2,4}\\b' + // 1. Januar 2024, 3 mars 2024
          '|(?:' + m + ')\\.?\\s+\\d{2,4}\\b' +                    // Januar 2024, Dec. 2024
          '|\\d{4}年\\d{1,2}月\\d{1,2}日' +                         // 2024年1月1日 (ZH/JA)
          '|\\d{4}年\\d{1,2}月' +                                    // 2024年1月
          '|\\d{1,2}月\\d{1,2}日' +                                  // 1月1日
          '|\\d{4}년\\s*\\d{1,2}월\\s*\\d{1,2}일' +                 // 2024년 1월 1일 (KO)
          '|\\d{4}년\\s*\\d{1,2}월' +                                // 2024년 1월
          '|\\d{1,2}월\\s*\\d{1,2}일' +                              // 1월 1일
          '|ngày\\s+\\d{1,2}\\s+tháng\\s+\\d{1,2}\\s+năm\\s+\\d{4}' + // ngày 1 tháng 1 năm 2024 (VI)
          '|tháng\\s+\\d{1,2}\\s+năm\\s+\\d{4}' +                  // tháng 1 năm 2024
          '|\\d{1,2}\\s+tháng\\s+\\d{1,2}' +                       // 1 tháng 1
        ')', 'gi')
    })(),
    personGroup: 'Datumsangaben',
  },
  id: {
    pattern: /\b(?=\S*\d\S*\d\S*\d)[A-Za-z0-9][A-Za-z0-9./-]{6,}[A-Za-z0-9]\b/g,
    personGroup: 'Kennungen',
  },
}

export const REGEX_CATEGORIES = Object.keys(PATTERNS) as RegexCategory[]

export function extractRegexEntities(
  pages: Array<{ pageIndex: number; text: string }>,
  categories: RegexCategory[] = REGEX_CATEGORIES,
): RedactionSuggestion[] {
  const suggestions: RedactionSuggestion[] = []
  const seen = new Set<string>()

  for (const { pageIndex, text } of pages) {
    if (!text.trim()) continue
    for (const cat of categories) {
      const { pattern, personGroup } = PATTERNS[cat]
      for (const match of text.matchAll(new RegExp(pattern))) {
        const key = `${pageIndex}:${match[0]}:${cat}`
        if (seen.has(key)) continue
        seen.add(key)
        suggestions.push({
          text: match[0],
          pageIndex,
          confidence: 'high',
          personGroup,
          person: undefined,
          reason: `Pattern: ${cat}`,
        })
      }
    }
  }
  return suggestions
}
