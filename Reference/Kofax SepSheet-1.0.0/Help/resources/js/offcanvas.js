$(document).ready(function () {
  $('[data-toggle="offcanvas"]').click(function () {
    $('nav').toggleClass('active')
	$('#wrapper').toggleClass('active')
	$('.contextbutton').toggleClass('active')
	$('.headcontainer').toggleClass('active')
  });
});
$(".dropdown-menu.example").on("click", function(e){
    e.stopPropagation();
});