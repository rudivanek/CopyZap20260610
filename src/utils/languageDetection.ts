/**
 * Simple language detection utility for Copy Snap
 * Detects the dominant language in a text input
 */

interface LanguagePattern {
  name: string;
  code: string;
  patterns: RegExp[];
  commonWords: string[];
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    name: 'English',
    code: 'en',
    patterns: [/\b(the|and|for|are|but|not|you|all|can|her|was|one|our|out|day)\b/i],
    commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'are', 'was', 'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may', 'should', 'does', 'being']
  },
  {
    name: 'Spanish',
    code: 'es',
    patterns: [/[áéíóúñ¿¡]/i, /\b(es|está|son|del|los|las|una|este|esta)\b/i],
    commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo', 'decir', 'tú', 'es', 'del', 'los', 'las', 'una', 'este', 'esta', 'son', 'está', 'están', 'fue', 'han', 'hay', 'era', 'eran', 'sea', 'será', 'sus', 'había', 'puede', 'pueden', 'sido', 'tienen', 'toda', 'todos', 'estas', 'estos']
  },
  {
    name: 'French',
    code: 'fr',
    patterns: [/[àâäéèêëïîôùûüÿœæç]/i, /\b(qu|au|du|où)\b/i],
    commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'que', 'vous', 'par', 'sur', 'faire', 'plus', 'dire', 'me', 'on', 'mon', 'lui', 'nous', 'comme', 'mais', 'pouvoir', 'avec', 'tout', 'y', 'aller', 'voir', 'en', 'bien', 'où', 'sans', 'tu', 'ou', 'leur', 'homme', 'si', 'deux', 'moi', 'vouloir', 'te', 'encore', 'votre', 'ni', 'jour', 'quelque', 'très', 'dont', 'là', 'grand', 'celui', 'notre', 'autre', 'même', 'prendre', 'quand', 'venir', 'donner', 'lui', 'eux', 'savoir', 'temps', 'depuis', 'donc', 'aussi', 'jamais', 'vie', 'puis', 'faut', 'cela', 'entre', 'tant', 'celui-ci', 'celui-là', 'chose', 'mettre', 'peu', 'nouveau', 'trouver', 'autre', 'soit', 'devenir', 'toujours', 'tous']
  },
  {
    name: 'German',
    code: 'de',
    patterns: [/[äöüß]/i, /\b(der|die|das|und|ist|den)\b/i],
    commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur', 'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'sei', 'in', 'prozent', 'hatte', 'kann', 'gegen', 'vom', 'können', 'schon', 'wenn', 'habe', 'seine', 'mark', 'ihre', 'dann', 'unter', 'wir', 'soll', 'ich', 'eines', 'es', 'jahr', 'zwei', 'jahren', 'diese', 'dieser', 'wieder', 'keine', 'seinem', 'ob', 'dir', 'allen', 'großen', 'jahres', 'werde', 'way', 'sowie', 'menschen', 'wären', 'during', 'my', 'machte']
  },
  {
    name: 'Italian',
    code: 'it',
    patterns: [/[àèéìòù]/i, /\b(il|lo|la|gli|che|di|della)\b/i],
    commonWords: ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'e', 'è', 'che', 'non', 'si', 'mi', 'ti', 'ci', 'vi', 'sono', 'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'essere', 'avere', 'fare', 'dire', 'andare', 'potere', 'volere', 'dovere', 'sapere', 'dare', 'stare', 'vedere', 'parlare', 'trovare', 'pensare', 'prendere', 'lasciare', 'mettere', 'venire', 'portare', 'chiamare', 'sentire', 'credere', 'capire', 'finire', 'partire', 'aprire', 'seguire', 'morire', 'offrire', 'scoprire', 'coprire']
  },
  {
    name: 'Portuguese',
    code: 'pt',
    patterns: [/[áàâãéêíóôõúç]/i, /\b(não|com|para|por|uma|mas)\b/i],
    commonWords: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele']
  },
  {
    name: 'Dutch',
    code: 'nl',
    patterns: [/\b(het|een|van|dat|zijn|ook|niet|aan|hij|dit|bij|uit|maar|wordt|heeft|werd|onder|tegen|wel|deze|zij|moet|zich|geen|waar|mijn|want|waren|wat|twee|jaar|veel|toen|andere|grote|tussen|zonder|dus|hun|zou|nieuwe|daar|alleen|mensen|binnen|vooral|deel|ons|groot|vaak|zelf|ongeveer)\b/i],
    commonWords: ['het', 'een', 'van', 'dat', 'voor', 'met', 'niet', 'aan', 'ook', 'zijn', 'als', 'hij', 'dit', 'bij', 'uit', 'maar', 'door', 'naar', 'over', 'tot', 'wordt', 'kan', 'worden', 'meer', 'heeft', 'nog', 'werd', 'onder', 'tegen', 'wel', 'hier', 'hebben', 'dan', 'deze', 'zo', 'zij', 'nu', 'moet', 'zich', 'geen', 'waar', 'mijn', 'want', 'waren', 'wat', 'worden', 'twee', 'jaar', 'veel', 'toen', 'eerste', 'andere', 'grote', 'tussen', 'zonder', 'dus', 'hun', 'staat', 'hele', 'komen', 'zou', 'nieuwe', 'laten', 'daar', 'waren', 'alleen', 'mensen', 'binnen', 'vooral', 'deel', 'ons', 'later', 'groot', 'vaak', 'zelf', 'ongeveer']
  },
  {
    name: 'Russian',
    code: 'ru',
    patterns: [/[а-яА-ЯёЁ]/],
    commonWords: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из', 'у', 'который', 'то', 'за', 'свой', 'что', 'весь', 'год', 'от', 'так', 'о', 'для', 'ты', 'же', 'все', 'тот', 'мочь', 'вы', 'человек', 'такой', 'его', 'сказать', 'только', 'или', 'еще', 'бы', 'себя', 'один', 'как', 'уже', 'до', 'время', 'если', 'сам', 'когда', 'другой', 'вот', 'наш', 'свой', 'ну', 'где', 'там', 'чем', 'более', 'всё', 'потом', 'очень', 'знать', 'хотеть', 'ее', 'мой', 'думать', 'она', 'сразу', 'потому', 'всегда']
  },
  {
    name: 'Japanese',
    code: 'ja',
    patterns: [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/],
    commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの', 'という', 'あり', 'まで', 'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって', 'により', 'おり', 'より', 'による', 'ず', 'なり', 'られる', 'において', 'ば', 'なかっ', 'なく', 'しかし', 'について', 'せ', 'だっ', 'その後', 'できる', 'それ', 'う', 'ので', 'なお', 'のみ', 'でき', 'き', 'つ', 'における', 'および', 'いう', 'さらに', 'でも', 'ら', 'たり', 'その他', 'に関する', 'たち', 'ます', 'ん', 'なら', 'に対して', '特に', 'せる']
  },
  {
    name: 'Chinese',
    code: 'zh',
    patterns: [/[\u4E00-\u9FFF]/],
    commonWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到', '作', '地', '于', '出', '就', '分', '对', '成', '会', '可', '主', '发', '年', '动', '同', '工', '也', '能', '下', '过', '子', '说', '产', '种', '面', '而', '方', '后', '多', '定', '行', '学', '法', '所', '民', '得', '经', '十', '三', '之', '进', '着', '等', '部', '度', '家', '电', '力', '里', '如', '水', '化', '高', '自', '二', '理', '起', '小', '物', '现', '实', '加', '量', '都', '两', '体', '制', '机', '当', '使', '点', '从', '业', '本', '去', '把', '性', '好', '应', '开', '它', '合', '还', '因', '由', '其', '些', '然', '前', '外', '天', '政', '四', '日', '那', '社', '义', '事', '平', '形', '相', '全', '表', '间', '样', '与', '关', '各', '重', '新', '线', '内', '数', '正', '心', '反', '你', '明', '看', '原', '又', '么', '利', '比', '或', '但', '质', '气', '第', '向', '道', '命', '此', '变', '条', '只', '没', '结', '解', '问', '意', '建', '月', '公', '无', '系', '军', '很', '情', '者', '最', '立', '代', '想', '已', '通', '并', '提', '直', '题', '党', '程', '展', '五', '果', '料', '象', '员', '革', '位', '入', '常', '文', '总', '次', '品', '式', '活', '设', '及', '管', '特', '件', '长', '求', '老', '头', '基', '资', '边', '流', '路', '级', '少', '图', '山', '统', '接', '知', '较', '将', '组', '见', '计', '别', '她', '手', '角', '期', '根', '论', '运', '农', '指', '几', '九', '区', '强', '放', '决', '西', '被', '干', '做', '必', '战', '先', '回', '则', '任', '取', '据', '处', '队', '南', '给', '色', '光', '门', '即', '保', '治', '北', '造', '百', '规', '热', '领', '七', '海', '口', '东', '导', '器', '压', '志', '世', '金', '增', '争', '济', '阶', '油', '思', '术', '极', '交', '受', '联', '什', '认', '六', '共', '权', '收', '证', '改', '清', '美', '再', '采', '转', '更', '单', '风', '切', '打', '白', '教', '速', '花', '带', '安', '场', '身', '车', '例', '真', '务', '具', '万', '每', '目', '至', '达', '走', '积', '示', '议', '声', '报', '斗', '完', '类', '八', '离', '华', '名', '确', '才', '科', '张', '信', '马', '节', '话', '米', '整', '空', '元', '况', '今', '集', '温', '传', '土', '许', '步', '群', '广', '石', '记', '需', '段', '研', '界', '拉', '林', '律', '叫', '且', '究', '观', '越', '织', '装', '影', '算', '低', '持', '音', '众', '书', '布', '复', '容', '儿', '须', '际', '商', '非', '验', '连', '断', '深', '难', '近', '矿', '千', '周', '委', '素', '技', '备', '半', '办', '青', '省', '列', '习', '响', '约', '支', '般', '史', '感', '劳', '便', '团', '往', '酸', '历', '市', '克', '何', '除', '消', '构', '府', '称', '太', '准', '精', '值', '号', '率', '族', '维', '划', '选', '标', '写', '存', '候', '毛', '亲', '快', '效', '斯', '院', '查', '江', '型', '眼', '王', '按', '格', '养', '易', '置', '派', '层', '片', '始', '却', '专', '状', '育', '厂', '京', '识', '适', '属', '圆', '包', '火', '住', '调', '满', '县', '局', '照', '参', '红', '细', '引', '听', '该', '铁', '价', '严', '龙', '飞']
  },
  {
    name: 'Korean',
    code: 'ko',
    patterns: [/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/],
    commonWords: ['이', '그', '저', '것', '수', '있', '하', '등', '들', '나', '보', '되', '않', '없', '주', '오', '않', '더', '도', '말', '같', '싶', '말', '어', '아', '이다', '하다', '있다', '없다', '되다', '않다', '하다', '그', '이', '저', '것', '수', '보', '있', '하', '등', '들', '나', '주', '오', '말', '같', '싶', '더', '도', '어', '아']
  },
  {
    name: 'Arabic',
    code: 'ar',
    patterns: [/[\u0600-\u06FF]/],
    commonWords: ['في', 'من', 'إلى', 'أن', 'على', 'هذا', 'أو', 'ذلك', 'بعد', 'قبل', 'هذه', 'كان', 'لم', 'إذا', 'كل', 'لكن', 'عن', 'أيضا', 'بعض', 'ها', 'قد', 'الذي', 'كانت', 'التي', 'ثم', 'لا', 'يكون', 'لن', 'هناك', 'كما', 'هو', 'فقط', 'معظم', 'حتى', 'الآن', 'بها', 'فيها', 'غير', 'به', 'ومن', 'خلال', 'حيث', 'الأن', 'بأن', 'لدى', 'منها', 'مع', 'هي', 'عليه', 'عليها', 'منذ', 'عام', 'ضد', 'هم', 'جدا', 'عبر', 'حوالي', 'مرة', 'لماذا', 'الكثير']
  },
  {
    name: 'Hindi',
    code: 'hi',
    patterns: [/[\u0900-\u097F]/],
    commonWords: ['के', 'का', 'एक', 'में', 'की', 'है', 'यह', 'और', 'से', 'हैं', 'को', 'पर', 'इस', 'होता', 'कि', 'जो', 'कर', 'मे', 'गया', 'करने', 'किया', 'लिये', 'अपने', 'ने', 'बनी', 'नहीं', 'तो', 'ही', 'या', 'एवं', 'दिया', 'हो', 'इसका', 'था', 'द्वारा', 'हुआ', 'तक', 'साथ', 'करना', 'वाले', 'बाद', 'लिए', 'आप', 'कुछ', 'सकते', 'किसी', 'इसके', 'सबसे', 'इसमें', 'थे', 'दो', 'होने', 'वह', 'वे', 'करते', 'बहुत', 'कहा', 'वर्ग', 'करें', 'होता', 'अब', 'जा', 'रहा', 'जाता', 'इसे', 'जाती', 'इन', 'करती', 'होती', 'अपनी', 'उनके', 'थी', 'हुई', 'सकता', 'रहे', 'उनकी', 'थीं', 'कहते', 'उस', 'कोई', 'इससे', 'करता', 'उनका', 'इसकी', 'सकती', 'इन', 'जिस', 'तरह', 'उसके', 'आदि', 'इसका', 'काफी', 'वाला', 'वाली', 'रखें', 'रहती', 'भी', 'होगा', 'जिसके', 'रखते', 'उसकी', 'होंगे', 'वर्ष', 'बड़ा', 'वहाँ', 'करना', 'जिसमें', 'बड़े', 'करते', 'जाने', 'रूप', 'बाहर', 'सकें', 'होते', 'करने', 'देर', 'जैसे', 'इस', 'परन्तु', 'अधिक', 'बड़ी', 'करूं', 'दूसरे', 'काम', 'वाली', 'दूसरा', 'वाला', 'दूसरी', 'सकते', 'तरीके', 'काफी', 'लगा', 'आए', 'जिसे', 'कई', 'लगे']
  }
];

/**
 * Detect the language of the input text
 * Returns the ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);

  // Store match scores for each language
  const scores: Record<string, number> = {};

  // Check each language pattern
  for (const lang of LANGUAGE_PATTERNS) {
    let score = 0;

    // Check for character patterns (strong indicator)
    for (const pattern of lang.patterns) {
      if (pattern.test(text)) {
        score += 100; // Strong indicator
        break;
      }
    }

    // Check for common words
    let wordMatches = 0;
    for (const word of words) {
      if (lang.commonWords.includes(word)) {
        wordMatches++;
      }
    }

    // Add word match score
    if (words.length > 0) {
      const wordMatchPercentage = (wordMatches / Math.min(words.length, 50)) * 100;
      score += wordMatchPercentage;
    }

    scores[lang.code] = score;
  }

  // Find the language with the highest score
  let maxScore = 0;
  let detectedLanguage = 'en';

  for (const [code, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLanguage = code;
    }
  }

  // Debug logging for top languages
  const topLanguages = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topLanguages.length > 0) {
    console.log('🌍 Language detection scores:', {
      textPreview: text.substring(0, 100),
      topLanguages: topLanguages.map(([code, score]) => ({
        code,
        name: LANGUAGE_PATTERNS.find(l => l.code === code)?.name,
        score: Math.round(score)
      })),
      detected: detectedLanguage
    });
  }

  // If no strong match found (score < 10), default to English
  if (maxScore < 10) {
    return 'en';
  }

  return detectedLanguage;
}

/**
 * Get language name from ISO code
 */
export function getLanguageName(code: string): string {
  const lang = LANGUAGE_PATTERNS.find(l => l.code === code);
  return lang ? lang.name : 'English';
}

/**
 * Convert language code to FormData Language type
 * Maps ISO codes ('es', 'en', etc.) to the Language type values
 */
export function convertLanguageCodeToFormDataLanguage(code: string): 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' {
  const mapping: Record<string, 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese'> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
  };

  return mapping[code] || 'English';
}
