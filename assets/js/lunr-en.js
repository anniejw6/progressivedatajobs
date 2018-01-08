---
layout: null
---

var idx = lunr(function () {
  this.field('title')
  this.field('excerpt')
  this.field('categories')
  this.field('tags')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  {% assign count = 0 %}
  {% for c in site.collections %}
    {% assign docs = c.docs | where_exp:'doc','doc.search != false' %}
    {% for doc in docs %}
      this.add({
          title: {{ doc.title | jsonify }},
          excerpt: {{ doc.content | strip_html | truncatewords: 20 | jsonify }},
          categories: {{ doc.categories | jsonify }},
          tags: {{ doc.tags | jsonify }},
          id: {{ count }}
      })
      {% assign count = count | plus: 1 %}
    {% endfor %}
  {% endfor %}
});

console.log( jQuery.type(idx) );

var store = [
  {% for c in site.collections %}
    {% if forloop.last %}
      {% assign l = true %}
    {% endif %}
    {% assign docs = c.docs | where_exp:'doc','doc.search != false' %}
    {% for doc in docs %}
      {% if doc.header.teaser %}
        {% capture teaser %}{{ doc.header.teaser }}{% endcapture %}
      {% else %}
        {% assign teaser = site.teaser %}
      {% endif %}
      {
        "title": {{ doc.title | jsonify }},
        "url": {{ doc.url | absolute_url | jsonify }},
        "excerpt": {{ doc.content | strip_html | truncatewords: 20 | jsonify }},
        "teaser":
          {% if teaser contains "://" %}
            {{ teaser | jsonify }}
          {% else %}
            {{ teaser | absolute_url | jsonify }}
          {% endif %}
      }{% unless forloop.last and l %},{% endunless %}
    {% endfor %}
  {% endfor %}]

$(document).ready(function() {
  $('input#search').on('keyup', function () {
    var resultdiv = $('#results');
    var query = $(this).val().toLowerCase();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, {  boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });
    resultdiv.empty();
    resultdiv.prepend('<p class="results__found">'+result.length+' {{ site.data.ui-text[site.locale].results_found | default: "Result(s) found" }}</p>');
    for (var item in result) {
      var ref = result[item].ref;
      if(store[ref].teaser){
        var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="http://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<div class="archive__item-teaser">'+
                '<img src="'+store[ref].teaser+'" alt="">'+
              '</div>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt+'</p>'+
            '</article>'+
          '</div>';
      }
      else{
    	  var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="http://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt+'</p>'+
            '</article>'+
          '</div>';
      }
      resultdiv.append(searchitem);
    }
  });
});
