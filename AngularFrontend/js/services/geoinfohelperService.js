/**
 * @ngdoc overview
 * @name GeoInfohelper
 *
 * @description Service that provides geographical information
 * @attention This service could be transformed into a REST resource
 * including these fields:
 *
 * - administrative_areas these are objects with two fields, abbreviation and full_name
 * - postal_code_not_used (true/false)
 * - administrative_area_used (true/false)
 * - administrative_area_required (true/false) (only NZ and GB don't require the adm area)
 * - administrative_area_label (State, Region, Province) default State
 * - postal_code_label (ZIP code, Postal code, Postcode) default Postal code
 * - locality_label (Town/City, City) default City
 */

var geoinfohelperServices = angular.module('geoinfohelperServices', [  ] );

/**
 * @ngdoc service
 * @name GeoInfohelper.service:GeoInfohelper
 * @description This service provides geographical information like
 * names of countries, regions, administrative areas and so on
 * Everything geography related should be here
 */
geoinfohelperServices.service('GeoInfohelper', [
    function() {

        var i;

        this.list_of_countries = [
            { isocode: "AF", name: "Afghanistan" },
            { isocode: "AX", name: "Åland Islands" },
            { isocode: "AL", name: "Albania" },
            { isocode: "DZ", name: "Algeria" },
            { isocode: "AS", name: "American Samoa" },
            { isocode: "AD", name: "Andorra" },
            { isocode: "AO", name: "Angola" },
            { isocode: "AI", name: "Anguilla" },
            { isocode: "AQ", name: "Antarctica" },
            { isocode: "AG", name: "Antigua and Barbuda" },
            { isocode: "AR", name: "Argentina" },
            { isocode: "AM", name: "Armenia" },
            { isocode: "AW", name: "Aruba" },
            { isocode: "AC", name: "Ascension Island" },
            { isocode: "AU", name: "Australia" },
            { isocode: "AT", name: "Austria" },
            { isocode: "AZ", name: "Azerbaijan" },
            { isocode: "BS", name: "Bahamas" },
            { isocode: "BH", name: "Bahrain" },
            { isocode: "BD", name: "Bangladesh" },
            { isocode: "BB", name: "Barbados" },
            { isocode: "BY", name: "Belarus" },
            { isocode: "BE", name: "Belgium" },
            { isocode: "BZ", name: "Belize" },
            { isocode: "BJ", name: "Benin" },
            { isocode: "BM", name: "Bermuda" },
            { isocode: "BT", name: "Bhutan" },
            { isocode: "BO", name: "Bolivia" },
            { isocode: "BQ", name: "Bonaire" },
            { isocode: "BA", name: "Bosnia and Herzegovina" },
            { isocode: "BW", name: "Botswana" },
            { isocode: "BV", name: "Bouvet Island" },
            { isocode: "BR", name: "Brazil" },
            { isocode: "IO", name: "British Indian Ocean Territory" },
            { isocode: "VG", name: "British Virgin Islands" },
            { isocode: "BN", name: "Brunei" },
            { isocode: "BG", name: "Bulgaria" },
            { isocode: "BF", name: "Burkina Faso" },
            { isocode: "BI", name: "Burundi" },
            { isocode: "KH", name: "Cambodia" },
            { isocode: "CM", name: "Cameroon" },
            { isocode: "CA", name: "Canada" },
            { isocode: "IC", name: "Canary Islands" },
            { isocode: "CV", name: "Cape Verde" },
            { isocode: "KY", name: "Cayman Islands" },
            { isocode: "CF", name: "Central African Republic" },
            { isocode: "EA", name: "Ceuta and Melilla" },
            { isocode: "TD", name: "Chad" },
            { isocode: "CL", name: "Chile" },
            { isocode: "CN", name: "China" },
            { isocode: "CX", name: "Christmas Island" },
            { isocode: "CP", name: "Clipperton Island" },
            { isocode: "CC", name: "Cocos [Keeling] Islands" },
            { isocode: "CO", name: "Colombia" },
            { isocode: "KM", name: "Comoros" },
            { isocode: "CG", name: "Congo - Brazzaville" },
            { isocode: "CD", name: "Congo - Kinshasa" },
            { isocode: "CK", name: "Cook Islands" },
            { isocode: "CR", name: "Costa Rica" },
            { isocode: "CI", name: "Côte d’Ivoire" },
            { isocode: "HR", name: "Croatia" },
            { isocode: "CU", name: "Cuba" },
            { isocode: "CW", name: "Curaçao" },
            { isocode: "CY", name: "Cyprus" },
            { isocode: "CZ", name: "Czech Republic" },
            { isocode: "DK", name: "Denmark" },
            { isocode: "DG", name: "Diego Garcia" },
            { isocode: "DJ", name: "Djibouti" },
            { isocode: "DM", name: "Dominica" },
            { isocode: "DO", name: "Dominican Republic" },
            { isocode: "EC", name: "Ecuador" },
            { isocode: "EG", name: "Egypt" },
            { isocode: "SV", name: "El Salvador" },
            { isocode: "GQ", name: "Equatorial Guinea" },
            { isocode: "ER", name: "Eritrea" },
            { isocode: "EE", name: "Estonia" },
            { isocode: "ET", name: "Ethiopia" },
            { isocode: "EU", name: "European Union" },
            { isocode: "FK", name: "Falkland Islands" },
            { isocode: "FO", name: "Faroe Islands" },
            { isocode: "FJ", name: "Fiji" },
            { isocode: "FI", name: "Finland" },
            { isocode: "FR", name: "France" },
            { isocode: "GF", name: "French Guiana" },
            { isocode: "PF", name: "French Polynesia" },
            { isocode: "TF", name: "French Southern Territories" },
            { isocode: "GA", name: "Gabon" },
            { isocode: "GM", name: "Gambia" },
            { isocode: "GE", name: "Georgia" },
            { isocode: "DE", name: "Germany" },
            { isocode: "GH", name: "Ghana" },
            { isocode: "GI", name: "Gibraltar" },
            { isocode: "GR", name: "Greece" },
            { isocode: "GL", name: "Greenland" },
            { isocode: "GD", name: "Grenada" },
            { isocode: "GP", name: "Guadeloupe" },
            { isocode: "GU", name: "Guam" },
            { isocode: "GT", name: "Guatemala" },
            { isocode: "GG", name: "Guernsey" },
            { isocode: "GN", name: "Guinea" },
            { isocode: "GW", name: "Guinea-Bissau" },
            { isocode: "GY", name: "Guyana" },
            { isocode: "HT", name: "Haiti" },
            { isocode: "HM", name: "Heard Island and McDonald Islands" },
            { isocode: "HN", name: "Honduras" },
            { isocode: "HK", name: "Hong Kong SAR China" },
            { isocode: "HU", name: "Hungary" },
            { isocode: "IS", name: "Iceland" },
            { isocode: "IN", name: "India" },
            { isocode: "ID", name: "Indonesia" },
            { isocode: "IR", name: "Iran" },
            { isocode: "IQ", name: "Iraq" },
            { isocode: "IE", name: "Ireland" },
            { isocode: "IM", name: "Isle of Man" },
            { isocode: "IL", name: "Israel" },
            { isocode: "IT", name: "Italy" },
            { isocode: "JM", name: "Jamaica" },
            { isocode: "JP", name: "Japan" },
            { isocode: "JE", name: "Jersey" },
            { isocode: "JO", name: "Jordan" },
            { isocode: "KZ", name: "Kazakhstan" },
            { isocode: "KE", name: "Kenya" },
            { isocode: "KI", name: "Kiribati" },
            { isocode: "KW", name: "Kuwait" },
            { isocode: "KG", name: "Kyrgyzstan" },
            { isocode: "LA", name: "Laos" },
            { isocode: "LV", name: "Latvia" },
            { isocode: "LB", name: "Lebanon" },
            { isocode: "LS", name: "Lesotho" },
            { isocode: "LR", name: "Liberia" },
            { isocode: "LY", name: "Libya" },
            { isocode: "LI", name: "Liechtenstein" },
            { isocode: "LT", name: "Lithuania" },
            { isocode: "LU", name: "Luxembourg" },
            { isocode: "MO", name: "Macau SAR China" },
            { isocode: "MK", name: "Macedonia" },
            { isocode: "MG", name: "Madagascar" },
            { isocode: "MW", name: "Malawi" },
            { isocode: "MY", name: "Malaysia" },
            { isocode: "MV", name: "Maldives" },
            { isocode: "ML", name: "Mali" },
            { isocode: "MT", name: "Malta" },
            { isocode: "MH", name: "Marshall Islands" },
            { isocode: "MQ", name: "Martinique" },
            { isocode: "MR", name: "Mauritania" },
            { isocode: "MU", name: "Mauritius" },
            { isocode: "YT", name: "Mayotte" },
            { isocode: "MX", name: "Mexico" },
            { isocode: "FM", name: "Micronesia" },
            { isocode: "MD", name: "Moldova" },
            { isocode: "MC", name: "Monaco" },
            { isocode: "MN", name: "Mongolia" },
            { isocode: "ME", name: "Montenegro" },
            { isocode: "MS", name: "Montserrat" },
            { isocode: "MA", name: "Morocco" },
            { isocode: "MZ", name: "Mozambique" },
            { isocode: "MM", name: "Myanmar [Burma]" },
            { isocode: "NA", name: "Namibia" },
            { isocode: "NR", name: "Nauru" },
            { isocode: "NP", name: "Nepal" },
            { isocode: "NL", name: "Netherlands" },
            { isocode: "AN", name: "Netherlands Antilles" },
            { isocode: "NC", name: "New Caledonia" },
            { isocode: "NZ", name: "New Zealand" },
            { isocode: "NI", name: "Nicaragua" },
            { isocode: "NE", name: "Niger" },
            { isocode: "NG", name: "Nigeria" },
            { isocode: "NU", name: "Niue" },
            { isocode: "NF", name: "Norfolk Island" },
            { isocode: "KP", name: "North Korea" },
            { isocode: "MP", name: "Northern Mariana Islands" },
            { isocode: "NO", name: "Norway" },
            { isocode: "OM", name: "Oman" },
            { isocode: "QO", name: "Outlying Oceania" },
            { isocode: "PK", name: "Pakistan" },
            { isocode: "PW", name: "Palau" },
            { isocode: "PS", name: "Palestinian Territories" },
            { isocode: "PA", name: "Panama" },
            { isocode: "PG", name: "Papua New Guinea" },
            { isocode: "PY", name: "Paraguay" },
            { isocode: "PE", name: "Peru" },
            { isocode: "PH", name: "Philippines" },
            { isocode: "PN", name: "Pitcairn Islands" },
            { isocode: "PL", name: "Poland" },
            { isocode: "PT", name: "Portugal" },
            { isocode: "PR", name: "Puerto Rico" },
            { isocode: "QA", name: "Qatar" },
            { isocode: "RE", name: "Réunion" },
            { isocode: "RO", name: "Romania" },
            { isocode: "RU", name: "Russia" },
            { isocode: "RW", name: "Rwanda" },
            { isocode: "BL", name: "Saint Barthélemy" },
            { isocode: "SH", name: "Saint Helena" },
            { isocode: "KN", name: "Saint Kitts and Nevis" },
            { isocode: "LC", name: "Saint Lucia" },
            { isocode: "MF", name: "Saint Martin" },
            { isocode: "PM", name: "Saint Pierre and Miquelon" },
            { isocode: "VC", name: "Saint Vincent and the Grenadines" },
            { isocode: "WS", name: "Samoa" },
            { isocode: "SM", name: "San Marino" },
            { isocode: "ST", name: "São Tomé and Príncipe" },
            { isocode: "SA", name: "Saudi Arabia" },
            { isocode: "SN", name: "Senegal" },
            { isocode: "RS", name: "Serbia" },
            { isocode: "CS", name: "Serbia and Montenegro" },
            { isocode: "SC", name: "Seychelles" },
            { isocode: "SL", name: "Sierra Leone" },
            { isocode: "SG", name: "Singapore" },
            { isocode: "SX", name: "Sint Maarten" },
            { isocode: "SK", name: "Slovakia" },
            { isocode: "SI", name: "Slovenia" },
            { isocode: "SB", name: "Solomon Islands" },
            { isocode: "SO", name: "Somalia" },
            { isocode: "ZA", name: "South Africa" },
            { isocode: "GS", name: "South Georgia and the South Sandwich Islands" },
            { isocode: "KR", name: "South Korea" },
            { isocode: "SS", name: "South Sudan" },
            { isocode: "ES", name: "Spain" },
            { isocode: "LK", name: "Sri Lanka" },
            { isocode: "SD", name: "Sudan" },
            { isocode: "SR", name: "Suriname" },
            { isocode: "SJ", name: "Svalbard and Jan Mayen" },
            { isocode: "SZ", name: "Swaziland" },
            { isocode: "SE", name: "Sweden" },
            { isocode: "CH", name: "Switzerland" },
            { isocode: "SY", name: "Syria" },
            { isocode: "TW", name: "Taiwan" },
            { isocode: "TJ", name: "Tajikistan" },
            { isocode: "TZ", name: "Tanzania" },
            { isocode: "TH", name: "Thailand" },
            { isocode: "TL", name: "Timor-Leste" },
            { isocode: "TG", name: "Togo" },
            { isocode: "TK", name: "Tokelau" },
            { isocode: "TO", name: "Tonga" },
            { isocode: "TT", name: "Trinidad and Tobago" },
            { isocode: "TA", name: "Tristan da Cunha" },
            { isocode: "TN", name: "Tunisia" },
            { isocode: "TR", name: "Turkey" },
            { isocode: "TM", name: "Turkmenistan" },
            { isocode: "TC", name: "Turks and Caicos Islands" },
            { isocode: "TV", name: "Tuvalu" },
            { isocode: "UM", name: "U.S. Minor Outlying Islands" },
            { isocode: "VI", name: "U.S. Virgin Islands" },
            { isocode: "UG", name: "Uganda" },
            { isocode: "UA", name: "Ukraine" },
            { isocode: "AE", name: "United Arab Emirates" },
            { isocode: "GB", name: "United Kingdom" },
            { isocode: "US", name: "United States" },
            { isocode: "UY", name: "Uruguay" },
            { isocode: "UZ", name: "Uzbekistan" },
            { isocode: "VU", name: "Vanuatu" },
            { isocode: "VA", name: "Vatican City" },
            { isocode: "VE", name: "Venezuela" },
            { isocode: "VN", name: "Vietnam" },
            { isocode: "WF", name: "Wallis and Futuna" },
            { isocode: "EH", name: "Western Sahara" },
            { isocode: "YE", name: "Yemen" },
            { isocode: "ZM", name: "Zambia" },
            { isocode: "ZW", name: "Zimbabwe" }
        ];

        // This lookup array will be useful when we are asked the full object
        // (isocode and name) given the iso code only

        this.country_lookup = {};
        for (i = 0, len = this.list_of_countries.length; i < len; i++) {
            this.country_lookup[this.list_of_countries[i].isocode] = this.list_of_countries[i];
        }

        this.administrative_areas = [];

        // Administrative areas (States) for Brazil
        this.administrative_areas['BR'] = [
            { abbreviation: 'AC', full_name: 'Acre' },
            { abbreviation: 'AL', full_name: 'Alagoas' },
            { abbreviation: 'AM', full_name: 'Amazonas' },
            { abbreviation: 'AP', full_name: 'Amapá' },
            { abbreviation: 'BA', full_name: 'Bahia' },
            { abbreviation: 'CE', full_name: 'Ceará' },
            { abbreviation: 'DF', full_name: 'Distrito Federal' },
            { abbreviation: 'ES', full_name: 'Espírito Santo' },
            { abbreviation: 'GO', full_name: 'Goiás' },
            { abbreviation: 'MA', full_name: 'Maranhão' },
            { abbreviation: 'MG', full_name: 'Minas Gerais' },
            { abbreviation: 'MS', full_name: 'Mato Grosso do Sul' },
            { abbreviation: 'MT', full_name: 'Mato Grosso' },
            { abbreviation: 'PA', full_name: 'Pará' },
            { abbreviation: 'PB', full_name: 'Paraíba' },
            { abbreviation: 'PE', full_name: 'Pernambuco' },
            { abbreviation: 'PI', full_name: 'Piauí' },
            { abbreviation: 'PR', full_name: 'Paraná' },
            { abbreviation: 'RJ', full_name: 'Rio de Janeiro' },
            { abbreviation: 'RN', full_name: 'Rio Grande do Norte' },
            { abbreviation: 'RO', full_name: 'Rondônia' },
            { abbreviation: 'RR', full_name: 'Roraima' },
            { abbreviation: 'RS', full_name: 'Rio Grande do Sul' },
            { abbreviation: 'SC', full_name: 'Santa Catarina' },
            { abbreviation: 'SE', full_name: 'Sergipe' },
            { abbreviation: 'SP', full_name: 'São Paulo' },
            { abbreviation: 'TO', full_name: 'Tocantins' }
        ];

        // Administrative areas (States) for USA
        this.administrative_areas['US'] = [
            { abbreviation: 'AK', full_name: 'Alaska' },
            { abbreviation: 'AL', full_name: 'Alabama' },
            { abbreviation: 'AR', full_name: 'Arkansas' },
            { abbreviation: 'AZ', full_name: 'Arizona' },
            { abbreviation: 'CA', full_name: 'California' },
            { abbreviation: 'CO', full_name: 'Colorado' },
            { abbreviation: 'CT', full_name: 'Connecticut' },
            { abbreviation: 'DC', full_name: 'Washington, D.C.' },
            { abbreviation: 'DE', full_name: 'Delaware' },
            { abbreviation: 'FL', full_name: 'Florida' },
            { abbreviation: 'GA', full_name: 'Georgia' },
            { abbreviation: 'HI', full_name: 'Hawaii' },
            { abbreviation: 'IA', full_name: 'Iowa' },
            { abbreviation: 'ID', full_name: 'Idaho' },
            { abbreviation: 'IL', full_name: 'Illinois' },
            { abbreviation: 'IN', full_name: 'Indiana' },
            { abbreviation: 'KS', full_name: 'Kansas' },
            { abbreviation: 'KY', full_name: 'Kentucky' },
            { abbreviation: 'LA', full_name: 'Louisiana' },
            { abbreviation: 'MA', full_name: 'Massachusetts' },
            { abbreviation: 'MD', full_name: 'Maryland' },
            { abbreviation: 'ME', full_name: 'Maine' },
            { abbreviation: 'MI', full_name: 'Michigan' },
            { abbreviation: 'MN', full_name: 'Minnesota' },
            { abbreviation: 'MO', full_name: 'Missouri' },
            { abbreviation: 'MS', full_name: 'Mississippi' },
            { abbreviation: 'MT', full_name: 'Montana' },
            { abbreviation: 'NC', full_name: 'North Carolina' },
            { abbreviation: 'ND', full_name: 'North Dakota' },
            { abbreviation: 'NE', full_name: 'Nebraska' },
            { abbreviation: 'NH', full_name: 'New Hampshire' },
            { abbreviation: 'NJ', full_name: 'New Jersey' },
            { abbreviation: 'NM', full_name: 'New Mexico' },
            { abbreviation: 'NV', full_name: 'Nevada' },
            { abbreviation: 'NY', full_name: 'New York' },
            { abbreviation: 'OH', full_name: 'Ohio' },
            { abbreviation: 'OK', full_name: 'Oklahoma' },
            { abbreviation: 'OR', full_name: 'Oregon' },
            { abbreviation: 'PA', full_name: 'Pennsylvania' },
            { abbreviation: 'RI', full_name: 'Rhode Island' },
            { abbreviation: 'SC', full_name: 'South Carolina' },
            { abbreviation: 'SD', full_name: 'South Dakota' },
            { abbreviation: 'TN', full_name: 'Tennessee' },
            { abbreviation: 'TX', full_name: 'Texas' },
            { abbreviation: 'UT', full_name: 'Utah' },
            { abbreviation: 'VA', full_name: 'Virginia' },
            { abbreviation: 'VT', full_name: 'Vermont' },
            { abbreviation: 'WA', full_name: 'Washington' },
            { abbreviation: 'WI', full_name: 'Wisconsin' },
            { abbreviation: 'WV', full_name: 'West Virginia' },
            { abbreviation: 'WY', full_name: 'Wyoming' }
        ];

        // Administrative areas (Provinces) for Italy
        this.administrative_areas['IT'] = [
            { abbreviation: 'AG', full_name: 'Agrigento' },
            { abbreviation: 'AL', full_name: 'Alessandria' },
            { abbreviation: 'AN', full_name: 'Ancona' },
            { abbreviation: 'AO', full_name: 'Aosta/Aoste' },
            { abbreviation: 'AP', full_name: 'Ascoli Piceno' },
            { abbreviation: 'AQ', full_name: 'L\'Aquila' },
            { abbreviation: 'AR', full_name: 'Arezzo' },
            { abbreviation: 'AT', full_name: 'Asti' },
            { abbreviation: 'AV', full_name: 'Avellino' },
            { abbreviation: 'BA', full_name: 'Bari' },
            { abbreviation: 'BG', full_name: 'Bergamo' },
            { abbreviation: 'BI', full_name: 'Biella' },
            { abbreviation: 'BL', full_name: 'Belluno' },
            { abbreviation: 'BN', full_name: 'Benevento' },
            { abbreviation: 'BO', full_name: 'Bologna' },
            { abbreviation: 'BR', full_name: 'Brindisi' },
            { abbreviation: 'BS', full_name: 'Brescia' },
            { abbreviation: 'BT', full_name: 'Barletta-Andria-Trani' },
            { abbreviation: 'BZ', full_name: 'Bolzano/Bozen' },
            { abbreviation: 'CA', full_name: 'Cagliari' },
            { abbreviation: 'CB', full_name: 'Campobasso' },
            { abbreviation: 'CE', full_name: 'Caserta' },
            { abbreviation: 'CH', full_name: 'Chieti' },
            { abbreviation: 'CI', full_name: 'Carbonia-Iglesias' },
            { abbreviation: 'CL', full_name: 'Caltanissetta' },
            { abbreviation: 'CN', full_name: 'Cuneo' },
            { abbreviation: 'CO', full_name: 'Como' },
            { abbreviation: 'CR', full_name: 'Cremona' },
            { abbreviation: 'CS', full_name: 'Cosenza' },
            { abbreviation: 'CT', full_name: 'Catania' },
            { abbreviation: 'CZ', full_name: 'Catanzaro' },
            { abbreviation: 'EN', full_name: 'Enna' },
            { abbreviation: 'FC', full_name: 'Forlì-Cesena' },
            { abbreviation: 'FE', full_name: 'Ferrara' },
            { abbreviation: 'FG', full_name: 'Foggia' },
            { abbreviation: 'FI', full_name: 'Firenze' },
            { abbreviation: 'FM', full_name: 'Fermo' },
            { abbreviation: 'FR', full_name: 'Frosinone' },
            { abbreviation: 'GE', full_name: 'Genova' },
            { abbreviation: 'GO', full_name: 'Gorizia' },
            { abbreviation: 'GR', full_name: 'Grosseto' },
            { abbreviation: 'IM', full_name: 'Imperia' },
            { abbreviation: 'IS', full_name: 'Isernia' },
            { abbreviation: 'KR', full_name: 'Crotone' },
            { abbreviation: 'LC', full_name: 'Lecco' },
            { abbreviation: 'LE', full_name: 'Lecce' },
            { abbreviation: 'LI', full_name: 'Livorno' },
            { abbreviation: 'LO', full_name: 'Lodi' },
            { abbreviation: 'LT', full_name: 'Latina' },
            { abbreviation: 'LU', full_name: 'Lucca' },
            { abbreviation: 'MB', full_name: 'Monza e Brianza' },
            { abbreviation: 'MC', full_name: 'Macerata' },
            { abbreviation: 'VS', full_name: 'Medio Campidano' },
            { abbreviation: 'ME', full_name: 'Messina' },
            { abbreviation: 'MI', full_name: 'Milano' },
            { abbreviation: 'MN', full_name: 'Mantova' },
            { abbreviation: 'MO', full_name: 'Modena' },
            { abbreviation: 'MS', full_name: 'Massa-Carrara' },
            { abbreviation: 'MT', full_name: 'Matera' },
            { abbreviation: 'NA', full_name: 'Napoli' },
            { abbreviation: 'NO', full_name: 'Novara' },
            { abbreviation: 'NU', full_name: 'Nuoro' },
            { abbreviation: 'OG', full_name: 'Ogliastra' },
            { abbreviation: 'OR', full_name: 'Oristano' },
            { abbreviation: 'OT', full_name: 'Olbia-Tempio' },
            { abbreviation: 'PA', full_name: 'Palermo' },
            { abbreviation: 'PC', full_name: 'Piacenza' },
            { abbreviation: 'PD', full_name: 'Padova' },
            { abbreviation: 'PE', full_name: 'Pescara' },
            { abbreviation: 'PG', full_name: 'Perugia' },
            { abbreviation: 'PI', full_name: 'Pisa' },
            { abbreviation: 'PN', full_name: 'Pordenone' },
            { abbreviation: 'PO', full_name: 'Prato' },
            { abbreviation: 'PR', full_name: 'Parma' },
            { abbreviation: 'PT', full_name: 'Pistoia' },
            { abbreviation: 'PU', full_name: 'Pesaro e Urbino' },
            { abbreviation: 'PV', full_name: 'Pavia' },
            { abbreviation: 'PZ', full_name: 'Potenza' },
            { abbreviation: 'RA', full_name: 'Ravenna' },
            { abbreviation: 'RC', full_name: 'Reggio Calabria' },
            { abbreviation: 'RE', full_name: 'Reggio Emilia' },
            { abbreviation: 'RG', full_name: 'Ragusa' },
            { abbreviation: 'RI', full_name: 'Rieti' },
            { abbreviation: 'RM', full_name: 'Roma' },
            { abbreviation: 'RN', full_name: 'Rimini' },
            { abbreviation: 'RO', full_name: 'Rovigo' },
            { abbreviation: 'SA', full_name: 'Salerno' },
            { abbreviation: 'SI', full_name: 'Siena' },
            { abbreviation: 'SO', full_name: 'Sondrio' },
            { abbreviation: 'SP', full_name: 'La Spezia' },
            { abbreviation: 'SR', full_name: 'Siracusa' },
            { abbreviation: 'SS', full_name: 'Sassari' },
            { abbreviation: 'SV', full_name: 'Savona' },
            { abbreviation: 'TA', full_name: 'Taranto' },
            { abbreviation: 'TE', full_name: 'Teramo' },
            { abbreviation: 'TN', full_name: 'Trento' },
            { abbreviation: 'TO', full_name: 'Torino' },
            { abbreviation: 'TP', full_name: 'Trapani' },
            { abbreviation: 'TR', full_name: 'Terni' },
            { abbreviation: 'TS', full_name: 'Trieste' },
            { abbreviation: 'TV', full_name: 'Treviso' },
            { abbreviation: 'UD', full_name: 'Udine' },
            { abbreviation: 'VA', full_name: 'Varese' },
            { abbreviation: 'VB', full_name: 'Verbano-Cusio-Ossola' },
            { abbreviation: 'VC', full_name: 'Vercelli' },
            { abbreviation: 'VE', full_name: 'Venezia' },
            { abbreviation: 'VI', full_name: 'Vicenza' },
            { abbreviation: 'VR', full_name: 'Verona' },
            { abbreviation: 'VT', full_name: 'Viterbo' },
            { abbreviation: 'VV', full_name: 'Vibo-Valentia' }
        ];

        // Administrative areas (Provinces) for Canada
        this.administrative_areas['CA'] = [
            { abbreviation: 'AB ', full_name: 'Alberta' },
            { abbreviation: 'BC ', full_name: 'British Columbia' },
            { abbreviation: 'MB ', full_name: 'Manitoba' },
            { abbreviation: 'NB ', full_name: 'New Brunswick' },
            { abbreviation: 'NL ', full_name: 'Newfoundland and Labrador' },
            { abbreviation: 'NT ', full_name: 'Northwest Territories' },
            { abbreviation: 'NS ', full_name: 'Nova Scotia' },
            { abbreviation: 'NU ', full_name: 'Nunavut' },
            { abbreviation: 'ON ', full_name: 'Ontario' },
            { abbreviation: 'PE ', full_name: 'Prince Edward Island' },
            { abbreviation: 'QC ', full_name: 'Quebec' },
            { abbreviation: 'SK ', full_name: 'Saskatchewan' },
            { abbreviation: 'YT ', full_name: 'Yukon Territory' }
        ];

        // Administrative areas (States) for Australia
        this.administrative_areas['AU'] = [
            { abbreviation: 'ACT', full_name: 'Australian Capital Territory' },
            { abbreviation: 'NSW', full_name: 'New South Wales' },
            { abbreviation: 'NT',  full_name: 'Northern Territory' },
            { abbreviation: 'QLD', full_name: 'Queensland' },
            { abbreviation: 'SA',  full_name: 'South Australia' },
            { abbreviation: 'TAS', full_name: 'Tasmania' },
            { abbreviation: 'VIC', full_name: 'Victoria' },
            { abbreviation: 'WA',  full_name: 'Western Australia' }
        ];

        // Administrative areas (Regions) for New Zealand
        this.administrative_areas['NZ'] = [
            { abbreviation: 'AUK', full_name: 'Auckland' },
            { abbreviation: 'BOP', full_name: 'Bay of Plenty' },
            { abbreviation: 'CAN', full_name: 'Canterbury' },
            { abbreviation: 'CIT', full_name: 'Chatham Islands Territory' },
            { abbreviation: 'GIS', full_name: 'Gisborne District' },
            { abbreviation: 'HKB', full_name: 'Hawke\'s Bay' },
            { abbreviation: 'MBH', full_name: 'Marlborough District' },
            { abbreviation: 'MWT', full_name: 'Manawatu-Wanganui' },
            { abbreviation: 'NSN', full_name: 'Nelson' },
            { abbreviation: 'NTL', full_name: 'Northland' },
            { abbreviation: 'OTA', full_name: 'Otago' },
            { abbreviation: 'STL', full_name: 'Southland' },
            { abbreviation: 'TAS', full_name: 'Tasman District' },
            { abbreviation: 'TKI', full_name: 'Taranaki' },
            { abbreviation: 'WGN', full_name: 'Wellington' },
            { abbreviation: 'WKO', full_name: 'Waikato' },
            { abbreviation: 'WTC', full_name: 'West Coast' }
        ];

        //console.debug('DBG-8yg5rr administrative_areas_lookup');

        this.administrative_areas_lookup = {};

        for (var country_code in this.administrative_areas) {

            //console.debug('DBG-jij key: ' + country_code);
            //console.debug(this.administrative_areas[country_code]);
            this.administrative_areas_lookup[country_code] = {};

            for (i = 0, len = this.administrative_areas[country_code].length; i < len; i++) {
                this.administrative_areas_lookup[country_code][this.administrative_areas[country_code][i].abbreviation] =
                    this.administrative_areas[country_code][i];
            }
        }

        //console.debug(this.administrative_areas_lookup);

        this.list_of_countries_that_dont_use_postal_codes = [ 'AF', 'AG', 'AL', 'AO', 'BB', 'BI', 'BJ', 'BO', 'BS', 'BW', 'BZ',
                 'CF', 'CG', 'CM', 'CO', 'DJ', 'DM', 'EG', 'ER', 'FJ', 'GD', 'GH', 'GM', 'GQ', 'GY', 'HK', 'IE', 'KI', 'KM',
                 'KP', 'KY', 'LC', 'LY', 'ML', 'MR', 'NA', 'NR', 'RW', 'SB', 'SC', 'SL', 'SR', 'ST', 'TD', 'TG', 'TL', 'TO',
                 'TT', 'TV', 'TZ', 'UG', 'VC', 'VU', 'WS', 'ZW' ];

        this.list_of_countries_that_use_administrative_areas = [ 'AR', 'AU', 'BR', 'BS', 'BY', 'BZ', 'CA', 'CN', 'DO', 'EG',
                 'ES', 'FJ', 'FM', 'GB', 'HN', 'ID', 'IE', 'IN', 'IT', 'JO', 'JP', 'KI', 'KN', 'KR', 'KW', 'KY', 'KZ', 'MX',
                 'MY', 'MZ', 'NG', 'NI', 'NR', 'NZ', 'OM', 'PA', 'PF', 'PG', 'PH', 'PR', 'PW', 'RU', 'SM', 'SO', 'SR', 'SV',
                 'TH', 'TW', 'UA', 'US', 'UY', 'VE', 'VI', 'VN', 'YU', 'ZA' ];

        this.list_of_countries_that_dont_require_the_administrative_area = [ 'GB', 'NZ' ];

        this.administrative_area_label = { 'CA':'Province',
                                           'GB':'County',
                                           'IT':'Province',
                                           'NZ':'Region' };

        this.postal_code_label = { 'GB':'Postcode',
                                   'NZ':'Postcode',
                                   'US':'ZIP Code' };

        this.locality_label = { 'GB':'Town or City',
                                'NZ':'Town or City' };

        /**
         * @ngdoc method
         * @name load_list_of_countries
         * @methodOf GeoInfohelper.service:GeoInfohelper
         * @description Just returning the list of countries
         *
         * @return {array} Array of country objects
         */
        this.load_list_of_countries = function() {

            return this.list_of_countries;
        };

        /**
         * @ngdoc method
         * @name country_object_from_iso_code
         * @methodOf GeoInfohelper.service:GeoInfohelper
         * @description Returning the full country object for the country whose iso code is given
         *
         * @return {object} Country object for the country whose iso code is given
         */
        this.country_object_from_iso_code = function(iso_code) {

            return this.country_lookup[iso_code];
        };

        /**
         * @ngdoc method
         * @name administrative_area_object_from_country_code_and_area_abbreviation
         * @methodOf GeoInfohelper.service:GeoInfohelper
         * @description Given the country iso code and the abbreviation of an administrative area,
         * returns the full administrative area object
         *
         * @return {object} Administrative area object for the administrative area whose abbreviation is given
         */
        this.administrative_area_object_from_country_code_and_area_abbreviation = function(iso_code, abbreviation) {

            return this.administrative_areas_lookup[iso_code][abbreviation];
        };

        /**
         * @ngdoc method
         * @name load_geo_info_for_country
         * @methodOf GeoInfohelper.service:GeoInfohelper
         * @description Given a country code, this function returns an object that
         * has the following properties:
         *
         * - `administrative_areas` these are objects with two fields, abbreviation and full_name
         * - `postal_code_used` true if the country uses postal codes
         * - `administrative_area_used` true if the country uses administrative areas
         * - `administrative_area_required` true if the country requires the administrative area
         * - `administrative_area_label` (State, Region, Province) default State How the administrative
         * area is called
         * - `postal_code_label` (ZIP code, Postal code, Postcode) default Postal code How the postal code
         * is called
         * - `locality_label` (Town/City, City) default City Label to use for the locality field
         *
         * The country code this function needs is the two letters code defined by
         * [ISO 3166](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
         * @see load_list_of_countries
         *
         * @param {string} country_code The two-digits code of the country we return information about
         */
        this.load_geo_info_for_country = function(country_code) {

            var country_info = {};

            country_info.country_code = country_code;

            // * administrative_areas these are objects with two fields, abbreviation and full_name
            // * postal_code_used (true/false)
            // * administrative_area_used (true/false)
            // * administrative_area_required (true/false) (only NZ and GB don't require the adm area)
            // * administrative_area_label (State, Region, Province) default State
            // * postal_code_label (ZIP code, Postal code, Postcode) default Postal code
            // * locality_label (Town/City, City) default City

            // Administrative areas list

            if (!(typeof(this.administrative_areas[country_code]) === 'undefined')) {

                country_info.administrative_areas = this.administrative_areas[country_code];

            } else {

                country_info.administrative_areas = null;

            }

            //console.debug('DBG-lgifc85FV list_of_countries_that_dont_use_postal_codes indexOf');
            //console.debug(this.list_of_countries_that_dont_use_postal_codes.indexOf(country_code));

            country_info.postal_code_used = this.list_of_countries_that_dont_use_postal_codes.indexOf(country_code) == -1;
            country_info.administrative_area_used = this.list_of_countries_that_use_administrative_areas.indexOf(country_code) != -1;

            if (this.list_of_countries_that_dont_require_the_administrative_area.indexOf(country_code) != -1) {

                // The country doesn't require the administrative area specified in the address

                country_info.administrative_area_required = false;

            } else {

                // The country is not listed among the ones that don't require the administrative area
                // We assume that it requires the administrative area if it uses it

                country_info.administrative_area_required = country_info.administrative_area_used;

            }

            if (!(typeof(this.administrative_area_label[country_code]) === 'undefined')) {

                country_info.administrative_area_label = this.administrative_area_label[country_code];

            } else {

                country_info.administrative_area_label = 'State';

            }

            if (!(typeof(this.postal_code_label[country_code]) === 'undefined')) {

                country_info.postal_code_label = this.postal_code_label[country_code];

            } else {

                country_info.postal_code_label = 'Postal code';

            }

            if (!(typeof(this.locality_label[country_code]) === 'undefined')) {

                country_info.locality_label = this.locality_label[country_code];

            } else {

                country_info.locality_label = 'City';

            }

            return country_info;
        };

    }]);
