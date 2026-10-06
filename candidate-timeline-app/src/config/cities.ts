export interface City {
  id: string
  name: string
  state: string
  country: string
  aliases: string[]
}

/**
 * Cities master used to normalise spelling and auto-fill the country.
 * Format per line: Name|State|alias, alias
 */
const INDIA = `
New Delhi|Delhi|Delhi, Dilli
Visakhapatnam|Andhra Pradesh|Vizag, Vishakhapatnam
Vijayawada|Andhra Pradesh|Bezawada
Guntur|Andhra Pradesh|
Nellore|Andhra Pradesh|
Kurnool|Andhra Pradesh|
Tirupati|Andhra Pradesh|Tirupathi
Rajahmundry|Andhra Pradesh|Rajamahendravaram, Rajamundry
Kakinada|Andhra Pradesh|
Kadapa|Andhra Pradesh|Cuddapah
Anantapur|Andhra Pradesh|Anantapuram
Eluru|Andhra Pradesh|
Ongole|Andhra Pradesh|
Srikakulam|Andhra Pradesh|
Vizianagaram|Andhra Pradesh|
Chittoor|Andhra Pradesh|
Itanagar|Arunachal Pradesh|
Guwahati|Assam|Gauhati
Dibrugarh|Assam|
Silchar|Assam|
Jorhat|Assam|
Tezpur|Assam|
Nagaon|Assam|
Patna|Bihar|
Gaya|Bihar|
Bhagalpur|Bihar|
Muzaffarpur|Bihar|
Darbhanga|Bihar|
Purnia|Bihar|Purnea
Begusarai|Bihar|
Arrah|Bihar|Ara
Chapra|Bihar|Chhapra
Siwan|Bihar|
Raipur|Chhattisgarh|
Bilaspur|Chhattisgarh|
Durg|Chhattisgarh|
Bhilai|Chhattisgarh|
Jagdalpur|Chhattisgarh|
Korba|Chhattisgarh|
Panaji|Goa|Panjim
Margao|Goa|Madgaon
Ahmedabad|Gujarat|Amdavad
Surat|Gujarat|
Vadodara|Gujarat|Baroda
Rajkot|Gujarat|
Bhavnagar|Gujarat|
Jamnagar|Gujarat|
Gandhinagar|Gujarat|
Anand|Gujarat|
Junagadh|Gujarat|
Gurugram|Haryana|Gurgaon
Faridabad|Haryana|
Panipat|Haryana|
Ambala|Haryana|
Rohtak|Haryana|
Hisar|Haryana|Hissar
Karnal|Haryana|
Sonipat|Haryana|Sonepat
Shimla|Himachal Pradesh|Simla
Mandi|Himachal Pradesh|
Dharamshala|Himachal Pradesh|Dharamsala
Srinagar|Jammu and Kashmir|
Jammu|Jammu and Kashmir|
Ranchi|Jharkhand|
Jamshedpur|Jharkhand|Tatanagar
Dhanbad|Jharkhand|
Bokaro|Jharkhand|Bokaro Steel City
Hazaribagh|Jharkhand|
Deoghar|Jharkhand|
Bengaluru|Karnataka|Bangalore, Bengalooru, Banglore
Mysuru|Karnataka|Mysore
Mangaluru|Karnataka|Mangalore
Hubballi|Karnataka|Hubli
Dharwad|Karnataka|
Belagavi|Karnataka|Belgaum
Kalaburagi|Karnataka|Gulbarga
Davanagere|Karnataka|Davangere
Ballari|Karnataka|Bellary
Shivamogga|Karnataka|Shimoga
Tumakuru|Karnataka|Tumkur
Udupi|Karnataka|
Manipal|Karnataka|
Hassan|Karnataka|
Vijayapura|Karnataka|Bijapur
Mandya|Karnataka|
Chikkamagaluru|Karnataka|Chikmagalur
Thiruvananthapuram|Kerala|Trivandrum, Tiruvananthapuram
Kochi|Kerala|Cochin, Ernakulam
Kozhikode|Kerala|Calicut
Thrissur|Kerala|Trichur
Kollam|Kerala|Quilon
Kottayam|Kerala|
Kannur|Kerala|Cannanore
Alappuzha|Kerala|Alleppey
Palakkad|Kerala|Palghat
Malappuram|Kerala|
Pathanamthitta|Kerala|
Idukki|Kerala|Thodupuzha
Kasaragod|Kerala|Kasargod
Kalpetta|Kerala|Wayanad
Thiruvalla|Kerala|Tiruvalla
Changanassery|Kerala|Changanacherry
Perinthalmanna|Kerala|
Angamaly|Kerala|Angamali
Bhopal|Madhya Pradesh|
Indore|Madhya Pradesh|
Jabalpur|Madhya Pradesh|
Gwalior|Madhya Pradesh|
Ujjain|Madhya Pradesh|
Sagar|Madhya Pradesh|Saugor
Rewa|Madhya Pradesh|
Satna|Madhya Pradesh|
Mumbai|Maharashtra|Bombay
Pune|Maharashtra|Poona
Nagpur|Maharashtra|
Nashik|Maharashtra|Nasik
Chhatrapati Sambhajinagar|Maharashtra|Aurangabad
Thane|Maharashtra|
Navi Mumbai|Maharashtra|
Kolhapur|Maharashtra|
Solapur|Maharashtra|Sholapur
Amravati|Maharashtra|
Sangli|Maharashtra|
Latur|Maharashtra|
Akola|Maharashtra|
Nanded|Maharashtra|
Ahilyanagar|Maharashtra|Ahmednagar
Imphal|Manipur|
Shillong|Meghalaya|
Aizawl|Mizoram|
Kohima|Nagaland|
Dimapur|Nagaland|
Agartala|Tripura|
Gangtok|Sikkim|
Bhubaneswar|Odisha|Bhubaneshwar
Cuttack|Odisha|
Rourkela|Odisha|Raurkela
Berhampur|Odisha|Brahmapur
Sambalpur|Odisha|
Balasore|Odisha|Baleswar
Puri|Odisha|
Ludhiana|Punjab|
Amritsar|Punjab|
Jalandhar|Punjab|Jullundur
Patiala|Punjab|
Bathinda|Punjab|Bhatinda
Mohali|Punjab|SAS Nagar, Sahibzada Ajit Singh Nagar
Pathankot|Punjab|
Hoshiarpur|Punjab|
Chandigarh|Chandigarh|
Jaipur|Rajasthan|
Jodhpur|Rajasthan|
Udaipur|Rajasthan|
Kota|Rajasthan|
Ajmer|Rajasthan|
Bikaner|Rajasthan|
Alwar|Rajasthan|
Bhilwara|Rajasthan|
Sikar|Rajasthan|
Chennai|Tamil Nadu|Madras
Coimbatore|Tamil Nadu|Kovai
Madurai|Tamil Nadu|
Tiruchirappalli|Tamil Nadu|Trichy, Tiruchi
Salem|Tamil Nadu|
Tirunelveli|Tamil Nadu|
Vellore|Tamil Nadu|
Erode|Tamil Nadu|
Thoothukudi|Tamil Nadu|Tuticorin
Thanjavur|Tamil Nadu|Tanjore
Nagercoil|Tamil Nadu|
Dindigul|Tamil Nadu|
Kanchipuram|Tamil Nadu|Kancheepuram
Tiruppur|Tamil Nadu|Tirupur
Hyderabad|Telangana|
Secunderabad|Telangana|
Warangal|Telangana|
Karimnagar|Telangana|
Nizamabad|Telangana|
Khammam|Telangana|
Lucknow|Uttar Pradesh|
Kanpur|Uttar Pradesh|Cawnpore
Varanasi|Uttar Pradesh|Banaras, Benares, Benaras
Prayagraj|Uttar Pradesh|Allahabad
Agra|Uttar Pradesh|
Meerut|Uttar Pradesh|
Ghaziabad|Uttar Pradesh|
Noida|Uttar Pradesh|
Greater Noida|Uttar Pradesh|
Bareilly|Uttar Pradesh|
Moradabad|Uttar Pradesh|Muradabad
Aligarh|Uttar Pradesh|
Gorakhpur|Uttar Pradesh|
Jhansi|Uttar Pradesh|
Saharanpur|Uttar Pradesh|
Mathura|Uttar Pradesh|
Ayodhya|Uttar Pradesh|Faizabad
Firozabad|Uttar Pradesh|
Muzaffarnagar|Uttar Pradesh|
Azamgarh|Uttar Pradesh|
Dehradun|Uttarakhand|Dehra Dun
Haridwar|Uttarakhand|Hardwar
Rishikesh|Uttarakhand|
Haldwani|Uttarakhand|
Roorkee|Uttarakhand|
Kolkata|West Bengal|Calcutta
Howrah|West Bengal|
Durgapur|West Bengal|
Asansol|West Bengal|
Siliguri|West Bengal|
Kalyani|West Bengal|
Kanchrapara|West Bengal|
Barrackpore|West Bengal|Barrackpur
Kharagpur|West Bengal|
Bardhaman|West Bengal|Burdwan
Malda|West Bengal|English Bazar
Krishnanagar|West Bengal|
Haldia|West Bengal|
Barasat|West Bengal|
Puducherry|Puducherry|Pondicherry
Leh|Ladakh|
Port Blair|Andaman and Nicobar Islands|Sri Vijaya Puram
`

const ABROAD = `
Dubai|Dubai|United Arab Emirates
Abu Dhabi|Abu Dhabi|United Arab Emirates
Sharjah|Sharjah|United Arab Emirates
Riyadh|Riyadh|Saudi Arabia
Jeddah|Makkah|Saudi Arabia
Dammam|Eastern Province|Saudi Arabia
Doha|Doha|Qatar
Muscat|Muscat|Oman
Kuwait City|Al Asimah|Kuwait
Manama|Capital|Bahrain
Kathmandu|Bagmati|Nepal
`

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const cities: City[] = [
  ...INDIA.trim()
    .split('\n')
    .map((line) => {
      const [name, state, aliases = ''] = line.split('|')
      return {
        id: `in-${slug(name)}`,
        name,
        state,
        country: 'India',
        aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
      }
    }),
  ...ABROAD.trim()
    .split('\n')
    .map((line) => {
      const [name, state, country] = line.split('|')
      return { id: `x-${slug(name)}`, name, state, country, aliases: [] }
    }),
]

export function getCity(id: string | null | undefined): City | undefined {
  return cities.find((c) => c.id === id)
}
