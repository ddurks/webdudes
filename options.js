'use strict';

function handleFileDrop(evt) {
  evt.preventDefault();
  var files = evt.dataTransfer.files;

  var output = [];
  for(var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, 'bytes, last modified: ', f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a', '</li>');
  }
  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleFileSelect(evt) {
  var dt = evt.target;
  var files = dt.files;

  var output = [];
  for(var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') -', f.size, 'bytes, last modified: ', f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a', '</li>');
  }
  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(evt) {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
}

window.onload = function() {
  var dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileDrop, false);
  document.getElementById('fileUpload').addEventListener('change', handleFileSelect, false);
}
