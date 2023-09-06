/* Scriptorium Publishing Services
   Implements hash search.    

   22-May-09 - Internationalized.
   04-Feb-09 - Added phrase search capability.
   20-Oct-08 - New.

*/
// [Kofax] 2011-Mar-29 LB: In order to get the encoding correct, we need to make a few changes to the JavaScript 
// files sps_nav.js and sps_search.js and the nav_bar.html files in the sps_help/resource folder. Any reference to the 
// JavaScript file strings need to be changed from @<string>@ to ${<string>}. -->   

var sps_search = (function() {

  var index;
  var stopwords;

  function createIndex() {
    if(index != undefined)
      return;

    index = lunr(function () {
      this.field('TITLE', { boost: 10 })
      this.field('RAWTEXT')
      this.ref('ID')
    })

    index.pipeline.remove(lunr.stemmer);
    index.pipeline.remove(lunr.stopWordFilter);

    index.pipeline.add(function (token, tokenIndex, tokens) {
      if(stopwords[token] == undefined) return token;
    })

    documents.forEach(function (doc) {
      index.add(doc)
    })
  }

  var ie = (function(){

      var undef,
          v = 3,
          div = document.createElement('div'),
          all = div.getElementsByTagName('i');

      while (
          div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
          all[0]
      );

      return v > 4 ? v : undef;

  }());

 /* [Kofax] 2016-Oct-04 MAS: Retrieve localized strings from JavaScript code at the end of the HTML file. */
 function searchDoc(query) {
      if(ie < 9) {
        alert(msg_unsupported_browser);
        return;
      }

      createIndex();

      // First search without quotes
      var res = index.search(query.replace(/"/g, "").toLowerCase());
      if(/"/g.test(query)) {
          // We need to reindex
          var tmpIndex = lunr(function () {
              this.field('TITLE', { boost: 10 })
              this.field('RAWTEXT')
              this.ref('ID')
          });

          tmpIndex.pipeline.remove(lunr.stemmer);
          tmpIndex.pipeline.remove(lunr.stopWordFilter);

          tmpIndex.pipeline.add(function (token, tokenIndex, tokens) {
            if(stopwords[token] == undefined) return token;
          })

          res.forEach(function (r) {
            tmpIndex.add(documents[r.ref], undefined, query);
          })

          res = tmpIndex.search(query.toLowerCase());
      }

      return res;
  }

  var search_term = '';

  var publicApi = {
    sps_search1:  function sps_search1() {
        search_term = document.getElementById('searchbox').value;

        /* [Lexmark] 2016-Oct-21 BLJ: Set destination URL of search so all browsers load the destination properly */
        var url;
        var search_query_path = document.location.pathname + "?q=" + search_term;
        // 'document.location.pathname' has a '/' prefix, which IE does not understand. Using 'origin' will help.
        if (document.location.origin != "null") {
            // location.origin works for IE and Chrome
            url = document.location.origin + search_query_path;
        } else {
            // location.origin is null in firefox, but firefox understands the '/' prefix
            url = search_query_path;
        }
        document.location.assign(url);
    },
    
    sps_search2: function sps_search2(search_term) {
    
      /* The localized info here should actually be stored in the top-most frame.
        In previous iterations of the Help, this was populated in a localization phase,
        then accessed dynamically.  The steps may look obtuse, but become useful
        when dynamic localization is necessary.
        The localization phase has been short circuited for now. */
      // Create an object to hold the localized strings.
      var loc_strings = new Object();
      /* [Lexmark] 2016-Oct-04 MAS: Retrieve localized strings from JavaScript code at the end of the HTML file. */
      loc_strings.srch_nomatch  = msg_no_matches;
      loc_strings.srch_badquote = msg_bad_quotes; 
      loc_strings.stopwords = msg_stop_words;
      
      /* [Lexmark] 2016-Sep-08 MAS: Removed mouseover text for search results. */
      // loc_strings.srch_results = "Search results are listed in order of relevance, based on how often the search terms appear in a topic.";

      if(stopwords == undefined) {
        // initialize stopwords
        var stopArr = loc_strings.stopwords.split(' ');
        // convert into hashmap
        stopwords = {};
        stopArr.map(function(s) { stopwords[s] = true; });
        stopwords[""] = true;
      }

      var quote_array = new Array();
      var searchResults = $('main');
      var output = '';
      var out_title = '';

      // Get the string from the form.
      var o_string = search_term;
      if (o_string.length == 0) {
        return false;
      }

      // Separate the string into a series of words.
      // (Western language-oriented, for now.)
      o_string = o_string.replace(/\s+/g,' ');

      // Make sure there are an even number of quotes.
      // First handle escaped quotes. 
      o_string = o_string.replace(/\\"/g,'%22');
      // and apostrophes
      o_string = o_string.replace(/'/g,'%27');

      // qs is a temp location: fill it with only the quotation marks...
      var qs = o_string.replace(/[^"]/g,'');
      // Then see if there's an odd or even number of quotes
      if ((qs.length % 2) != 0) {
        alert(loc_strings.srch_badquote); //top.loc_strings.srch_badquote);
        return false;
      }
      //o_string = o_string.replace(/%22/g,'"');

      var all_pages = searchDoc(o_string);

      //  <div title="Search results" class="searchResults" id="searchSearchResults">
      var new_div = document.createElement("div");
      /* [Kofax] 2016-Sep-08 MAS: Removed mouseover text for search results. */
      // new_div.setAttribute("title",loc_strings.srch_results);
      new_div.setAttribute("class","searchResults");
      new_div.setAttribute("id","searchSearchResults");

      var ix;
      var new_a;
      if (all_pages == null || all_pages.length == 0) {
        //var msg = loc_strings.srch_nomatch; //top.loc_strings.srch_nomatch;
        //output = msg.replace("%s",o_string);
        new_div.appendChild(document.createTextNode(loc_strings.srch_nomatch));
      } else {
        for (i in all_pages){
            ix = all_pages[i];
            var doc = documents[ix.ref];
            out_title = doc.TITLE;
            out_title = out_title.replace(/%27/,"'");
            out_title = out_title.replace(/%22/,'"');
            out_title = out_title.replace(/%25/,'%');
            /*           output += '<a href="'+json_index.files[ix].name + 
                      '"class="searchlink" target="'+target_win+'">' + out_title +'</a><br/>\n';
            */                     
            // Belt and suspenders for now..
            var result_div = $("<div></div>");
            new_a = document.createElement("a");
            new_a.setAttribute("href",relativeToRoot + doc.HREF + "?h=" + search_term);
            new_a.setAttribute("class","searchlink");
            new_a.appendChild(document.createTextNode(out_title));
            new_a.appendChild(document.createElement("br"));
            result_div.append(new_a);
            $(result_div).append("<div class=\"summary\">" + doc.SUMMARY + "</div>");
            $(new_div).append(result_div);           
        } 
      } 

      // Show the search tips
      var resTitle = $(".searchContainerTitle").html();
      var newTitle = resTitle.replace("{searchVal}", "<span class=\"searchemphasis\">" + search_term + "</span>");
      newTitle = newTitle.replace("{total}", "<span class=\"searchemphasis\">" + all_pages.length + "</span>");
      $(".searchContainerTitle").html(newTitle);
      var searchTips = $('#searchTips').detach();

      searchResults.empty();
      $(new_div).prepend(searchTips);
      searchResults.append(new_div);      
      searchTips.show();
      
      // [Lexmark] 2016-Sep-09 SD: When searching on mobile, the following lines prevent the TOC from popping up
      // on the results page.
      $('nav').toggleClass('active')
	  $('#wrapper').toggleClass('active')
	  $('.contextbutton').toggleClass('active')
	  $('.headcontainer').toggleClass('active')     

      return true;    
    },
    
    highlight_search: function highlight_search(search_term) {
      //alert('search text is: '+searchbox.value);
      var phrase_array = getPhraseArray(search_term).filter(function(v){return !(/^\s*$/.test(v))});      
      $("main").highlight(phrase_array);
    },
    submitenter: function submitenter(myfield,e) {
      var keycode;
      if (window.event) keycode = window.event.keyCode;
      else if (e) keycode = e.which;
      else return false;
      
      if (keycode == 13) {
          return true;
      } else {
          return false;
      }
    }
  };

  return publicApi;

  function sps_clear_search(myform) {
    var searchResults = document.getElementById('searchSearchResults');
    searchResults.innerHTML = '';
    //myform.parentNode.getElementsByTagName('input')[0].value = '';
    var searchBox = document.getElementById('searchbox'); 
    searchBox.value = '';
    search_term = '';
    top.postMessage(JSON.stringify({ op:"update_search_term", param:'' , forceRefresh: true}), '*');
  }

  function getPhraseArray(string) {
      var quote_array = new Array();

      // Separate the string into a series of words.
      string = string.replace(/\s+/g,' ');

      // Make sure there are an even number of quotes.
      // First handle escaped quotes. 
      string = string.replace(/\\"/g,'%22');
      // and apostrophes
      string = string.replace(/'/g,'%27');

      quote_array = get_quotes(string);
      
      return(quote_array);
  }

  function get_quotes(o_string) {
    var out_array = new Array();
    var quote_array = new Array();
    var space_array = new Array();
    var q_string;
    
    quote_array = o_string.split('"');

    for (i in quote_array) {
        q_string = quote_array[i];
        // The even members are non-quoted
        if (i % 2 == 0 && q_string != '') {
          space_array = quote_array[i].split(' ');
          for (j in space_array) {
            out_array.push(space_array[j]);
          }
        } else {
            // otherwise, move the result to the out array.
            out_array.push(q_string);
        }
    }
    return(out_array);

  }
})();