/**
 * Global Constants
 */
const NUM_OF_FIELDS = 19;
const NUM_OF_CAREERS = 18;
const NUM_OF_RACES = 7; //MAX_AGE (6) + 1
const NUM_OF_AGES = 56; //MAX_AGE (55) + 1

const fieldCodeToFieldGroupMapping = [ // 7 unique groups
  null,
  'Law', //Law
  'Science', //Math
  'Science', //Social Science, Psychologist 
  'Science', //Medical Science, Pharmaceuticals, and Bio Tech
  'Engineering', //Engineering
  'Arts', //English/Creative Writing/ Journalism
  'Arts', //History/Religion/Philosophy
  'Business', //Business/Econ/Finance
  'Education', //Education, Academia
  'Science', //Biological Sciences/Chemistry/Physics
  'Arts', //Social Work
  'Other', //Undergrad/ undecided
  'Arts', //Political Science/International Affairs
  'Arts', //Film
  'Arts', //Fine Arts/Arts Administration
  'Arts', //Languages
  'Engineering', //Architecture
  'Other', //Other
]

const careerCodeToCareerGroupMapping = [ // 8 unique groups
  null,
  'Law', //Lawyer
  'Arts', // Academic/ Research
  'Science', // Psychologist
  'Medicine', // Doctor/Medicine
  'Engineering', // Engineer
  'Arts', // Creative Arts/Entertainment
  'Business', // Banking/Consulting/Finance/Marketing/Business/CEO/Entrepreneur/Admin
  'Business', // Real Estate
  'Law', // International/Humanitarian Affairs
  'Other', // Undecided
  'Arts', // Social Work
  'Science', // Speech Pathology
  'Law', // Politics
  'Sports', // Pro sports/Athletics
  'Other', // Other
  'Arts', // Journalism
  'Engineering', // Architecture
]

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/speedDating.csv').then(data => {
  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr != 'from') {
        d[attr] = +d[attr];
      }
    });
  });

  let femaleData = getGenderedData(data, 0);
  let maleData = getGenderedData(data, 1);
  
  let femaleMatchData = getMatches(femaleData, 0);
  let maleMatchData = getMatches(maleData, 1);

  let demographicData = getSubjectDemographicdata(data);

  getMatchingProbabilityMatrix(maleData, maleMatchData, demographicData, 'career_c', NUM_OF_CAREERS);

  getMatchingProbabilityMatrix(maleData, maleMatchData, demographicData, 'field_cd', NUM_OF_FIELDS);

  getMatchingProbabilityMatrix(maleData, maleMatchData, demographicData, 'race', NUM_OF_RACES);

  getMatchingProbabilityMatrix(maleData, maleMatchData, demographicData, 'age', NUM_OF_AGES);

  getMatchingProbabilityBars(maleData, maleMatchData, demographicData, 'career_c', NUM_OF_CAREERS);
  getMatchingProbabilityBars(femaleData, femaleMatchData, demographicData, 'career_c', NUM_OF_CAREERS);

  getMatchingProbabilityBars(maleData, maleMatchData, demographicData, 'field_cd', NUM_OF_FIELDS);
  getMatchingProbabilityBars(femaleData, femaleMatchData, demographicData, 'field_cd', NUM_OF_FIELDS);

  getMatchingProbabilityBars(maleData, maleMatchData, demographicData, 'race', NUM_OF_RACES);
  getMatchingProbabilityBars(femaleData, femaleMatchData, demographicData, 'race', NUM_OF_RACES);

  getMatchingProbabilityBars(maleData, maleMatchData, demographicData, 'age', NUM_OF_AGES);
  getMatchingProbabilityBars(femaleData, femaleMatchData, demographicData, 'age', NUM_OF_AGES);

  // Init charts
  barChart = new BarChart({ parentElement: '#bar'}, data);
  forceDirectedGraph = new ForceDirectedGraph({ parentElement: '#forceDirected'}, data);
  matrix = new Matrix({ parentElement: '#matric'}, data);
});

var getGenderedData = (data, gender) => {
  return data.filter(d => d.gender == gender);
}

var getMatches = (data) => {
  return data.filter(d => d.match == 1);
}

var getSubjectDemographicdata = (data) => {
  let map = new Map();
  data.forEach(d => {
    if (!map.has(d.iid)) {
      map.set(d.iid, {
        age: d.age,
        field_cd: d.field_cd,
        career_c: d.career_c,
        race: d.race,
        from: d.from
      });
    }
  });

  return map;
}

/**
  * Data pre-processing for adjacency matrix
  * The gender used for @param matchData and @param data does not influence the change the result BUT they MUST match,
  * the gender used for will be the row, and the opposite gender on the column.
  */
var getMatchingProbabilityMatrix = (data, matchData, demographicData, attribute, limit) => {
  let allCount = new Array(limit);
  let matchCount = new Array(limit);
  let probability = new Array(limit);

  for (let i = 0; i < limit; i++) {
    allCount[i] = new Array(limit);
    allCount[i].fill(0);
    matchCount[i] = new Array(limit);
    matchCount[i].fill(0);
    probability[i] = new Array(limit);
    probability[i].fill(0);
  }

  data.forEach(d => {
    if (d.pid) {
      allCount[d[attribute]][demographicData.get(d.pid)[attribute]]++;
    }
  });

  matchData.forEach(d => {
    if (d.pid) {
      matchCount[d[attribute]][demographicData.get(d.pid)[attribute]]++;
    }
  });

  for (let i = 0; i < limit; i++) {
    for (let j = 0; j < limit; j++) {
      probability[i][j] = allCount[i][j] == 0 ? 0 : matchCount[i][j]/allCount[i][j];
    }
  }

  return probability;
}

/**
  * Data pre-processing for bar chart
  * The gender used for @param matchData and @param data will the result AND they MUST match,
  */
var getMatchingProbabilityBars = (data, matchData, demographicData, attribute, limit) => {
  let total = new Array(limit); //total number of pairing for each value of an attribute for a gender;
  let totalMatches = new Array(limit); //total number of matches for each value of an attribute;
  total.fill(0);
  totalMatches.fill(0);

  let matchCount = new Array(limit);
  let probability = new Array(limit);

  for (let i = 0; i < limit; i++) {
    matchCount[i] = new Array(limit);
    matchCount[i].fill(0);
    probability[i] = new Array(limit+1);
    probability[i].fill(0);
  }

  data.forEach(d => {
    total[d[attribute]]++;
  });

  matchData.forEach(d => {
    if (d.pid) {
      matchCount[d[attribute]][demographicData.get(d.pid)[attribute]]++;
      totalMatches[d[attribute]]++;
    }
  });

  for (let i = 0; i < limit; i++) {
    for (let j = 0; j < limit; j++) {
      probability[i][j] = total[i] == 0 ? 0 : matchCount[i][j]/total[i];
    }
    probability[i][limit] = total[i] == 0 ? 0 : (total[i]-totalMatches[i])/total[i]; //last column indicates probability of not getting any match
  }

  return probability;
}