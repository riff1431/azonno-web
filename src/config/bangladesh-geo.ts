/**
 * Bangladesh Geo-Hierarchy (Divisions -> Districts -> Upazilas/Thanas)
 * and Shipping Zone Categorization for Dynamic Delivery Calculation.
 */

export interface DivisionInfo {
  name: string;
  districts: {
    name: string;
    zone: "inside_dhaka" | "outside_dhaka";
    thanas: string[];
  }[];
}

export const BD_GEO_HIERARCHY: DivisionInfo[] = [
  {
    name: "Dhaka",
    districts: [
      {
        name: "Dhaka City",
        zone: "inside_dhaka",
        thanas: [
          "Gulshan",
          "Banani",
          "Dhanmondi",
          "Uttara",
          "Mirpur",
          "Mohammadpur",
          "Badda",
          "Bashundhara R/A",
          "Baridhara",
          "Motijheel",
          "Paltan",
          "Shahbagh",
          "Tejgaon",
          "Khilgaon",
          "Rampura",
          "Malibagh",
          "Mohakhali",
          "Lalbagh",
          "Old Dhaka",
          "Jatrabari",
          "Shyamoli",
          "Kalyanpur",
          "Cantonment",
          "Kafrul",
        ],
      },
      {
        name: "Gazipur",
        zone: "outside_dhaka",
        thanas: ["Gazipur Sadar", "Tongi", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"],
      },
      {
        name: "Narayanganj",
        zone: "outside_dhaka",
        thanas: ["Narayanganj Sadar", "Bandar", "Fatullah", "Siddhirganj", "Sonargaon", "Rupganj", "Araihazar"],
      },
      {
        name: "Savar & Keraniganj",
        zone: "outside_dhaka",
        thanas: ["Savar Sadar", "Ashulia", "Keraniganj Sadar", "Dhamrai", "Nawabganj", "Dohar"],
      },
      {
        name: "Faridpur",
        zone: "outside_dhaka",
        thanas: ["Faridpur Sadar", "Boalmari", "Alfadanga", "Madhukhali", "Bhanga", "Nagarkanda", "Charbhadrasan", "Sadarpur", "Saltha"],
      },
      {
        name: "Gopalganj",
        zone: "outside_dhaka",
        thanas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
      },
      {
        name: "Kishoreganj",
        zone: "outside_dhaka",
        thanas: ["Kishoreganj Sadar", "Bhairab", "Bajitpur", "Katiadi", "Pakundia", "Karimgonj", "Tarail", "Hossainpur", "Itna", "Mithamain", "Nikli", "Austagram", "Kuliarchar"],
      },
      {
        name: "Madaripur",
        zone: "outside_dhaka",
        thanas: ["Madaripur Sadar", "Shibchar", "Kalkini", "Rajoir"],
      },
      {
        name: "Manikganj",
        zone: "outside_dhaka",
        thanas: ["Manikganj Sadar", "Singair", "Saturia", "Shivalaya", "Harirampur", "Ghior", "Daulatpur"],
      },
      {
        name: "Munshiganj",
        zone: "outside_dhaka",
        thanas: ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Louhajang", "Tongibari", "Gazaria"],
      },
      {
        name: "Narsingdi",
        zone: "outside_dhaka",
        thanas: ["Narsingdi Sadar", "Palash", "Belabo", "Monohardi", "Shibpur", "Raipura"],
      },
      {
        name: "Rajbari",
        zone: "outside_dhaka",
        thanas: ["Rajbari Sadar", "Goalanda", "Pangsha", "Baliakandi", "Kalukhali"],
      },
      {
        name: "Shariatpur",
        zone: "outside_dhaka",
        thanas: ["Shariatpur Sadar", "Zajira", "Naria", "Bhedarganj", "Damudya", "Gosairhat"],
      },
      {
        name: "Tangail",
        zone: "outside_dhaka",
        thanas: ["Tangail Sadar", "Mirzapur", "Ghatail", "Madhupur", "Sakhipur", "Kalihati", "Delduar", "Basail", "Nagarpur", "Bhuapur", "Dhanbari"],
      },
    ],
  },
  {
    name: "Chattogram",
    districts: [
      {
        name: "Chattogram",
        zone: "outside_dhaka",
        thanas: ["Kotwali", "Panchlaish", "Pahartali", "Khulshi", "Halishahar", "Agrabad", "Bakalia", "Patenga", "Hathazari", "Raozan", "Rangunia", "Fatikchhari", "Patiya", "Anwara", "Boalkhali", "Chandanaish", "Lohagara", "Satkania", "Banshkhali", "Sitakunda", "Mirsharai", "Sandwip"],
      },
      {
        name: "Cox's Bazar",
        zone: "outside_dhaka",
        thanas: ["Cox's Bazar Sadar", "Ramu", "Chakaria", "Pekua", "Kutubdia", "Maheshkhali", "Teknaf", "Ukhia"],
      },
      {
        name: "Cumilla",
        zone: "outside_dhaka",
        thanas: ["Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Chandina", "Debidwar", "Daudkandi", "Homna", "Muradnagar", "Brahmanpara", "Burichang", "Chauddagram", "Laksam", "Barura", "Monohargonj", "Meghna", "Titas"],
      },
      {
        name: "Feni",
        zone: "outside_dhaka",
        thanas: ["Feni Sadar", "Daganbhuiyan", "Chhagalnaiya", "Parshuram", "Fulgazi", "Sonagazi"],
      },
      {
        name: "Brahmanbaria",
        zone: "outside_dhaka",
        thanas: ["Brahmanbaria Sadar", "Kasba", "Nasirnagar", "Nabinagar", "Sarail", "Ashuganj", "Akhaura", "Bancharampur", "Bijoynagar"],
      },
      {
        name: "Noakhali",
        zone: "outside_dhaka",
        thanas: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Kabirhat"],
      },
      {
        name: "Chandpur",
        zone: "outside_dhaka",
        thanas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
      },
      {
        name: "Lakshmipur",
        zone: "outside_dhaka",
        thanas: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"],
      },
      {
        name: "Bandarban",
        zone: "outside_dhaka",
        thanas: ["Bandarban Sadar", "Ali Kadam", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi", "Lama"],
      },
      {
        name: "Khagrachhari",
        zone: "outside_dhaka",
        thanas: ["Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
      },
      {
        name: "Rangamati",
        zone: "outside_dhaka",
        thanas: ["Rangamati Sadar", "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali"],
      },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      {
        name: "Rajshahi",
        zone: "outside_dhaka",
        thanas: ["Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Paba", "Godagari", "Tanore", "Bagmara", "Durgapur", "Charghat", "Puthia", "Bagha", "Mohanpur"],
      },
      {
        name: "Bogura",
        zone: "outside_dhaka",
        thanas: ["Bogura Sadar", "Sherpur", "Shibganj", "Sariakandi", "Kahaloo", "Gabtali", "Dupchanchia", "Dhunat", "Adamdighi", "Nandigram", "Sonatala", "Shajahanpur"],
      },
      {
        name: "Pabna",
        zone: "outside_dhaka",
        thanas: ["Pabna Sadar", "Ishwardi", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Santhia", "Sujanagar"],
      },
      {
        name: "Sirajganj",
        zone: "outside_dhaka",
        thanas: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Rayganj", "Shahjadpur", "Tarash", "Ullapara"],
      },
      {
        name: "Naogaon",
        zone: "outside_dhaka",
        thanas: ["Naogaon Sadar", "Mohadevpur", "Manda", "Niamatpur", "Atrai", "Raninagar", "Patnitala", "Dhamoirhat", "Sapahar", "Porsha", "Badalgachhi"],
      },
      {
        name: "Natore",
        zone: "outside_dhaka",
        thanas: ["Natore Sadar", "Baraigram", "Bagatipara", "Gurudaspur", "Lalpur", "Singra", "Naldanga"],
      },
      {
        name: "Chapainawabganj",
        zone: "outside_dhaka",
        thanas: ["Chapainawabganj Sadar", "Gomastapur", "Nachole", "Bholahat", "Shibganj"],
      },
      {
        name: "Joypurhat",
        zone: "outside_dhaka",
        thanas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
      },
    ],
  },
  {
    name: "Khulna",
    districts: [
      {
        name: "Khulna",
        zone: "outside_dhaka",
        thanas: ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur", "Khan Jahan Ali", "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada"],
      },
      {
        name: "Jashore",
        zone: "outside_dhaka",
        thanas: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
      },
      {
        name: "Kushtia",
        zone: "outside_dhaka",
        thanas: ["Kushtia Sadar", "Kumarkhali", "Khoksa", "Mirpur", "Bheramara", "Daulatpur"],
      },
      {
        name: "Satkhira",
        zone: "outside_dhaka",
        thanas: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"],
      },
      {
        name: "Bagerhat",
        zone: "outside_dhaka",
        thanas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
      },
      {
        name: "Chuadanga",
        zone: "outside_dhaka",
        thanas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
      },
      {
        name: "Jhenaidah",
        zone: "outside_dhaka",
        thanas: ["Jhenaidah Sadar", "Harinakundu", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
      },
      {
        name: "Magura",
        zone: "outside_dhaka",
        thanas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
      },
      {
        name: "Meherpur",
        zone: "outside_dhaka",
        thanas: ["Meherpur Sadar", "Gangni", "Mujibnagar"],
      },
      {
        name: "Narail",
        zone: "outside_dhaka",
        thanas: ["Narail Sadar", "Kalia", "Lohagara"],
      },
    ],
  },
  {
    name: "Barishal",
    districts: [
      {
        name: "Barishal",
        zone: "outside_dhaka",
        thanas: ["Kotwali", "Airport", "Kawnia", "Bandar", "Bakerganj", "Babuganj", "Wazirpur", "Banaripara", "Gournadi", "Agailjhara", "Mehendiganj", "Muladi", "Hizla"],
      },
      {
        name: "Bhola",
        zone: "outside_dhaka",
        thanas: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
      },
      {
        name: "Patuakhali",
        zone: "outside_dhaka",
        thanas: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali", "Dumki"],
      },
      {
        name: "Pirojpur",
        zone: "outside_dhaka",
        thanas: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad (Swarupkati)", "Zianagar (Indurkani)"],
      },
      {
        name: "Barguna",
        zone: "outside_dhaka",
        thanas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
      },
      {
        name: "Jhalokati",
        zone: "outside_dhaka",
        thanas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
      },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      {
        name: "Sylhet",
        zone: "outside_dhaka",
        thanas: ["Kotwali", "Jalalabad", "Shah Paran", "South Surma", "Osmani Nagar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Zakiganj"],
      },
      {
        name: "Moulvibazar",
        zone: "outside_dhaka",
        thanas: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"],
      },
      {
        name: "Habiganj",
        zone: "outside_dhaka",
        thanas: ["Habiganj Sadar", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Ajmiriganj", "Shayestaganj"],
      },
      {
        name: "Sunamganj",
        zone: "outside_dhaka",
        thanas: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shantiganj", "Sullah", "Tahirpur", "Madhyanagar"],
      },
    ],
  },
  {
    name: "Rangpur",
    districts: [
      {
        name: "Rangpur",
        zone: "outside_dhaka",
        thanas: ["Kotwali", "Haragach", "Mahiganj", "Tajhat", "Parshuram", "Hazirhat", "Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
      },
      {
        name: "Dinajpur",
        zone: "outside_dhaka",
        thanas: ["Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
      },
      {
        name: "Gaibandha",
        zone: "outside_dhaka",
        thanas: ["Gaibandha Sadar", "Phulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
      },
      {
        name: "Kurigram",
        zone: "outside_dhaka",
        thanas: ["Kurigram Sadar", "Nageshwari", "Bhurungamari", "Phulbari", "Rajarhat", "Ulipur", "Chilmari", "Rowmari", "Char Rajibpur"],
      },
      {
        name: "Nilphamari",
        zone: "outside_dhaka",
        thanas: ["Nilphamari Sadar", "Saidpur", "Jaldhaka", "Kishoreganj", "Domar", "Dimla"],
      },
      {
        name: "Lalmonirhat",
        zone: "outside_dhaka",
        thanas: ["Lalmonirhat Sadar", "Aditmari", "Kaliganj", "Hatibandha", "Patgram"],
      },
      {
        name: "Panchagarh",
        zone: "outside_dhaka",
        thanas: ["Panchagarh Sadar", "Boda", "Debiganj", "Atwari", "Tetulia"],
      },
      {
        name: "Thakurgaon",
        zone: "outside_dhaka",
        thanas: ["Thakurgaon Sadar", "Pirganj", "Ranisankail", "Haripur", "Baliadangi"],
      },
    ],
  },
  {
    name: "Mymensingh",
    districts: [
      {
        name: "Mymensingh",
        zone: "outside_dhaka",
        thanas: ["Kotwali", "Muktagachha", "Trishal", "Bhaluka", "Fulbaria", "Gafargaon", "Haluaghat", "Ishwarganj", "Nandail", "Phulpur", "Dhobaura", "Tara Khanda"],
      },
      {
        name: "Jamalpur",
        zone: "outside_dhaka",
        thanas: ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"],
      },
      {
        name: "Netrokona",
        zone: "outside_dhaka",
        thanas: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala", "Khaliajuri"],
      },
      {
        name: "Sherpur",
        zone: "outside_dhaka",
        thanas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
      },
    ],
  },
];

/**
 * Determine dynamic shipping zone given district name:
 * Strictly "inside_dhaka" (Dhaka City) vs "outside_dhaka" (All other districts)
 */
export function getShippingZoneByDistrict(districtName: string): "inside_dhaka" | "outside_dhaka" {
  const normalized = (districtName || "").trim().toLowerCase();
  
  if (normalized.includes("dhaka city") || normalized === "dhaka") {
    return "inside_dhaka";
  }

  return "outside_dhaka";
}
