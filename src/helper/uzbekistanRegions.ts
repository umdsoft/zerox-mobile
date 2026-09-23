// O'zbekiston viloyatlari va tumanlari (lotin). Qarz daftari → do'kon manzili uchun.
// Sayt (frontend/assets/uzbekistan-regions.js) bilan BIR XIL — backend'ga NOM (string)
// sifatida yuboriladi (region, district).
export type UzRegion = { name: string; districts: string[] };

const REGIONS: UzRegion[] = [
  {
    name: 'Toshkent shahri',
    districts: [
      'Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor', 'Sergeli',
      'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod', 'Yunusobod', 'Yangihayot',
    ],
  },
  {
    name: 'Toshkent viloyati',
    districts: [
      'Bekobod', "Bo'ka", "Bo'stonliq", 'Chinoz', 'Qibray', 'Quyichirchiq', "Oqqo'rg'on",
      'Ohangaron', 'Olmaliq', 'Parkent', 'Piskent', "O'rtachirchiq", "Yangiyo'l",
      'Yuqorichirchiq', 'Zangiota', 'Toshkent tumani', 'Bekobod shahri', 'Ohangaron shahri',
      'Olmaliq shahri', 'Angren shahri', 'Chirchiq shahri', "Yangiyo'l shahri", 'Nurafshon shahri',
    ],
  },
  {
    name: 'Andijon viloyati',
    districts: [
      'Andijon', 'Asaka', 'Baliqchi', 'Buloqboshi', 'Izboskan', 'Jalaquduq', "Xo'jaobod",
      "Qo'rg'ontepa", 'Marhamat', "Oltinko'l", 'Paxtaobod', 'Shahrixon', "Ulug'nor",
      'Andijon shahri', 'Asaka shahri', 'Xonobod shahri',
    ],
  },
  {
    name: 'Buxoro viloyati',
    districts: [
      'Buxoro', "G'ijduvon", 'Jondor', 'Kogon', 'Olot', 'Peshku', "Qorako'l",
      'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent', 'Buxoro shahri', 'Kogon shahri',
    ],
  },
  {
    name: "Farg'ona viloyati",
    districts: [
      "Bag'dod", 'Beshariq', 'Buvayda', "Dang'ara", "Farg'ona", 'Furqat', "Qo'shtepa",
      'Quva', 'Quvasoy', 'Rishton', "So'x", 'Toshloq', "Uchko'prik", "O'zbekiston",
      'Yozyovon', 'Oltiariq', "Farg'ona shahri", "Marg'ilon shahri", "Qo'qon shahri", 'Quvasoy shahri',
    ],
  },
  {
    name: 'Jizzax viloyati',
    districts: [
      'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol", 'Sharof Rashidov',
      "Mirzacho'l", 'Paxtakor', 'Yangiobod', 'Zarbdor', 'Zafarobod', 'Zomin', 'Jizzax shahri',
    ],
  },
  {
    name: 'Xorazm viloyati',
    districts: [
      "Bog'ot", 'Gurlan', 'Xonqa', 'Hazorasp', 'Xiva', "Qo'shko'pir", 'Shovot',
      'Urganch', 'Yangiariq', 'Yangibozor', "Tuproqqal'a", 'Urganch shahri', 'Xiva shahri',
    ],
  },
  {
    name: 'Namangan viloyati',
    districts: [
      'Chortoq', 'Chust', 'Kosonsoy', 'Mingbuloq', 'Namangan', 'Norin', 'Pop',
      "To'raqo'rg'on", "Uchqo'rg'on", 'Uychi', "Yangiqo'rg'on", 'Namangan shahri',
    ],
  },
  {
    name: 'Navoiy viloyati',
    districts: [
      'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq',
      'Xatirchi', 'Navoiy shahri', 'Zarafshon shahri',
    ],
  },
  {
    name: 'Qashqadaryo viloyati',
    districts: [
      'Chiroqchi', 'Dehqonobod', "G'uzor", 'Kasbi', 'Kitob', 'Koson', 'Mirishkor',
      'Muborak', 'Nishon', 'Qamashi', 'Qarshi', 'Shahrisabz', "Yakkabog'",
      'Qarshi shahri', 'Shahrisabz shahri',
    ],
  },
  {
    name: 'Samarqand viloyati',
    districts: [
      "Bulung'ur", 'Ishtixon', 'Jomboy', "Kattaqo'rg'on", "Qo'shrabot", 'Narpay',
      'Nurobod', 'Oqdaryo', "Pastdarg'om", 'Paxtachi', 'Payariq', 'Samarqand', 'Toyloq',
      'Urgut', 'Samarqand shahri', "Kattaqo'rg'on shahri",
    ],
  },
  {
    name: 'Sirdaryo viloyati',
    districts: [
      'Boyovut', 'Guliston', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod',
      'Sirdaryo', 'Xovos', 'Guliston shahri', 'Shirin shahri', 'Yangiyer shahri',
    ],
  },
  {
    name: 'Surxondaryo viloyati',
    districts: [
      'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on", 'Qiziriq', "Qumqo'rg'on",
      'Muzrabot', 'Oltinsoy', 'Sariosiyo', 'Sherobod', "Sho'rchi", 'Termiz', 'Uzun', 'Termiz shahri',
    ],
  },
  {
    name: "Qoraqalpog'iston Respublikasi",
    districts: [
      'Amudaryo', 'Beruniy', "Bo'zatov", 'Chimboy', "Ellikqal'a", 'Kegeyli', "Mo'ynoq",
      'Nukus tumani', "Qanliko'l", "Qo'ng'irot", "Qorao'zak", 'Shumanay', "Taxtako'pir",
      "To'rtko'l", "Xo'jayli", 'Nukus shahri', 'Taxiatosh',
    ],
  },
];

export default REGIONS;
