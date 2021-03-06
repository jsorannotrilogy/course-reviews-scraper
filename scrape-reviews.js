 // Dependencies
var fs = require('fs'); 
var request = require('request');
var cheerio = require('cheerio')
var Nightmare = require('nightmare');
var schedule = require("node-schedule")
var S = require('string');

var data = require('./schools');

// var j = schedule.scheduleJob('* 2 * * 7', function(){
//   console.log("And we are live!");
  // Assemble Objects for Each URL (16 pages)
  newData = [];
  data.forEach(function(element) {

    for (var i = 1; i < 5; i++){
      new_element = Object.assign({}, element);
      new_element.url = element.url + "?page=" + i + "#/reviews"     
      newData.push({new_element})
    }
  })

  newData = newData.sort(function(school1, school2) {
    if (school1.new_element.school > school2.new_element.school) {
        return 1;
    } else if (school1.new_element.school < school2.new_element.school) {
        return -1;
     }

     return 0;
  });
  var scrapeCounter = 0;

  function runScrape(){
    console.log('counter', scrapeCounter)

    console.log(newData[scrapeCounter])
    if (newData[scrapeCounter]) {
      scrape(newData[scrapeCounter].new_element)
  }
  };


  var cleanRowHeadings = ['School', 'Trilogy' , 'Date', 'Course', 'Location', 'Verified', 'Overall Exp.', 'Curriculum', 'Instructors', 'Job Assistance', 'Comments', 'Word Count', "Life-Change"];

  fs.writeFile('bootcamp-reviews.csv', cleanRowHeadings + "\n" , 'utf8', function (err) {
      if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else{
        console.log('File Created!');
        runScrape()
      }
    });

  // pass in urlOb to determine which school object we are scraping from
  function scrape(urlOb){

    var schoolName = urlOb.school.toUpperCase()
    // console.log(urlOb.url())
    console.log(schoolName);

    var scrape = new Nightmare({
            show: false
        })
        .goto(urlOb.url)
        .wait(1000)
        .evaluate(function() {
            return document.body.innerHTML;
        }).end().then (function(html) {
          if (html === 'undefined') {
            console.log('========================');
            console.log('html not there!');
            console.log(arg);
            console.log('========================');
            return;
          }
          

      var $ = cheerio.load(html);

      var entry = $(".review");

      entry.each(function(reviewId, reviewEntry){
        var cleanRow = [];
        cleanRow.push(schoolName)
        cleanRow.push(urlOb.trilogy)

      // console.log((reviewId + 1) + ")")
        var review = $(this).children("div");
    // ============================ REVIEW DATE ============================ //

        if (!(
          review &&
          review[0].children[2] &&
          review[0].children[2].children[0] && 
          review[0].children[2].children[0].data))
        {
          console.log('here is the problem');
          cleanRow.push(reviewDate);
        }
        // children[2] gives us the object inside review that holds review-date information
        var reviewDate = review[0].children[2].children[0].data;
        // console.log(reviewDate);

    // ======================= Review Details =========================== //
        
      var reviewDetails = review[0].children[3].children.slice(1);
      console.log('fuck my asshole juanita')

      var location = "";
      var course = "";
      var verification = "";

       for (var z = 0; z < reviewDetails.length; z++) {
          if (!reviewDetails && reviewDetails[z] && reviewDetails[z].children) {
            console.log('SHIT');
            continue;
          }
          var details = reviewDetails[z].children[0];
          console.log('fuck everyone elses asshole')
          // console.log(details);
          if(details){
            var data = details.data
            if(details.type === 'text'){
              // console.log('details', details.data);

              if(data.indexOf('Campus:') >= 0){
                location = data;
                // console.log('location2', location)
              }else if(data.indexOf('Course:') >= 0){
                course = data;
                // console.log('course', course)
              }
              else if(data.indexOf('Verified') >= 0){
                verification = data;
                // console.log('ver', verification)
              }
            }else{
              // console.log('details', details.children[0].data)
              console.log('hwawnita sup');
              if (details.children) {
                var data2 = details.children[0].data;
                if(data2.indexOf('Verified') >= 0){
                  verification = data2;
                  // console.log('verif', verification)
                }
              }
            }
          }
        }

        course = course.replace(/[•\t.+]/g, "")
        course = course.replace(/\,/g, " ")
        course = course.replace("Course:", "")
        location = location.replace(/[•\t.+]/g, "")
        location = location.replace("Campus:", "")
        verification = verification.replace("Verified via", "")
        cleanRow.push(course)
        cleanRow.push(location)
        cleanRow.push(verification)

    // ======================== RATING CATEGORIES/STARS =========================== //

      // children[4] is associated with the .ratings class that holds rating information
      // each .rating class has 3 rows and we skip over the 1st row
      if (rating) { 
      var rating = review[0].children[4].children.slice(1);
      for (var i = 0; i < rating.length; i++) {  

    // ======= First row inside .ratings ======== //
    // category label for overall exp. and intructors
        var category1 = rating[i].children[0].children[0].data;


        if (rating[i].children[1].children[0].children[0].type === 'tag'){

          var cat1Star1 = rating[i].children[1].children[0];
          var cat1Star2 = cat1Star1.children[0];
          var cat1Star3 = cat1Star2.children[0];
          var cat1Star4 = cat1Star3.children[0];
          var cat1Star5 = cat1Star4.children[0];

          var cat1Stars = [cat1Star1, cat1Star2, cat1Star3, cat1Star4, cat1Star5];
          var cat1StarsFull = [];

          for (var j = 0; j < cat1Stars.length; j++) {
            if(cat1Stars[j].attribs.class === 'icon-full_star'){
              cat1StarsFull.push(cat1Stars[j])
            }
          }
        }

      // ====== Second row inside .ratings ======= //
      // category label for cirrculum and job assistance
          var category2 = rating[i].children[2].children[0].data;
          var cat2Stars = [];
          var cat2StarsFull =[];

        if (rating[i].children[3].children[0].children[0].type === 'tag'){

            var star = rating[i].children[1];
            var cat2Star1 = rating[i].children[3].children[0];
            var cat2Star2 = cat2Star1.children[0];
            var cat2Star3 = cat2Star2.children[0];
            var cat2Star4 = cat2Star3.children[0];
            var cat2Star5 = cat2Star4.children[0];
            cat2Stars = [cat2Star1, cat2Star2, cat2Star3, cat2Star4, cat2Star5];

            for (var k = 0; k < cat2Stars.length; k++) {
              if(cat2Stars[k].attribs.class === 'icon-full_star'){
                cat2StarsFull.push(cat2Stars[k])
              }
            }
          }
    
          //=============== Logged Categories/Stars ===============//

            // console.log(category1, cat1StarsFull.length)
            // console.log(category2, cat2StarsFull.length)
            cleanRow.push(cat1StarsFull.length, cat2StarsFull.length)

        } // =================== End of Rating =================== //

        // ============== Review Body Text ================== //


      var reviewBody = review[0].children[5].children[0].children[0].children;
      // check to see if a review text exists
      if(reviewBody){
        var bodyText;
        var comments = "";
        // have to loop around <p> tags inside the body
        for (var q = 0; q < reviewBody.length; q++) {
          var paragraph = reviewBody[q];
          // check to see if the paragraph object contains type = 
          // console.log('body', reviewBody)
          if(paragraph.type === 'tag' && paragraph.children[0]){
            bodyText = paragraph.children[0].data;
            // console.log('p1', paragraph.children[0])
            if(bodyText){
              // console.log(bodyText)
              comments = comments + bodyText;
              // comments.replace(',', ' ')
              // cleanRow.push(comments)
            }
            // for some reviews the review text is nested inside the <p> tag
            else{
              var bodyContainer = paragraph.children[0].children[0];
                // console.log('p2', paragraph.children[0].children[0])

              if(bodyContainer){
                bodyText = paragraph.children[0].children[0].data;
                if(bodyText !== 'Flag as inappropriate.' && bodyText !== 'This Review Is Helpful'){
                    comments = comments + bodyText;

                  }
                }
              }
            }
          }

        // We have to replace the commas in the comment section because the csv file will interpret a comma as a separation between cells
        // console.log('comments', comments)
          comments = comments.replace(/\,/g, "")
          comments = comments.replace(/"/g, "\\'");
          comments = '"' + comments + '"'
          cleanRow.push(comments)

          wordCount = comments.split(" ").length;
          cleanRow.push(wordCount)

          lifeChangeCount = S(comments.toLowerCase()).count("best decision") + S(comments.toLowerCase()).count("life changing") + S(comments.toLowerCase()).count("life-changing") + S(comments.toLowerCase()).count("changed my life") + S(comments.toLowerCase()).count("change your life")
          cleanRow.push(lifeChangeCount)
        }

        

      // console.log("--------------------------------------------------------");
      }
      console.log("nice comment");
        fs.appendFile('bootcamp-reviews.csv', cleanRow.join("\n") + "\n" , 'utf8', function (err) {
          if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
          } else{
            //console.log('It\'s saved!');
          }
        });
    });
        scrapeCounter++;
        runScrape();
    });

  }; // End of Scrape




// });






