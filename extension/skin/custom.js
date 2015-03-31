// Necessary because jQuery isn't imported until after the custom HTML
setTimeout(function() { 
	$(document).ready(function() {
		$("#ipython_notebook").find("img").attr("src", "/static/custom/GP_logo_on_black.png");
	});
}, 10);
