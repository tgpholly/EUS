<h1 align="center">
  <img width="150" height="150" src="http://ethanus.ml/images/logo.png">
</h1>
<p align="center">readme soon™</p>

<h1 align="center">
  Setup
</h1>
<p>EUS has extra dependancies other than <a href="https://github.com/tgpethan/Revolution">Revolution</a>'s base, of which include:<br><a href="https://www.npmjs.com/package/connect-busboy">connect-busboy</a><br><a href="https://www.npmjs.com/package/randomstring">randomstring</a><br><a href="https://www.npmjs.com/package/get-folder-size">get-folder-size</a><br>Install the dependancies and then simply drop the EUS.js into a Revolution instance's modules folder<br><b>(If you still have "example_request_handler.js" be sure to delete it!)</b><br>
If this is running at a URL then you can define the url to build from in the config with <b>baseURL</b>. Just don't put a / at the end!<br>
If you want to expand the files that the server allows to be sent to it this can be done in the <b>allowedTypes</b> array<br>
