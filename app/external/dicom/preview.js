
window.onload = function() {
  window.parent.postMessage("onload", "*");
}

window.initFromCuraCloud = function(study, params) {
  for (var key in params)
  {
    window[key] = params[key];
  }
  ImagePreview(study, true);
}

function gSwitchOperation(op) {
  if (op == 0) {
    ImageViewer.setOperationMode('window');
  } else if (op == 1) {
    ImageViewer.setOperationMode('pan');
  } else {
    ImageViewer.setOperationMode('zoom');
  }
}

function gSwitchPlaying() {
  if (!ImageViewer.elementEnabled) return;
  if (ImageViewer.playing) {
    ImageViewer.stopClip();
  } else {
    ImageViewer.playClip();
  }
}

function gReset() {
  ImageViewer.resetViewport();
}

function notifyPlayStatus(playing) {
  if (playing) {
    window.parent.postMessage("dicom_playing", "*");
  } else {
    window.parent.postMessage("dicom_pause", "*");
  }
}

function ImagePreview(study, enableSelect) {
  var baseUrl = null;
  if (window.serverAddr != null)
  {
    baseUrl = window.serverAddr + '/file/download/proxy/' + window.fileId + "/";
  }
  ImageViewer.setBaseUrl(baseUrl);
  ImageViewer.showPreviewDialog(study.series, enableSelect);
}

var ImageViewer = {
  dicomSeries: null,
  activeSeries: null,
  activeSeriesIndex: -1,
  activeThumbnail: null,
  previewContainer: null,
  elementEnabled: false,
  currentFrame: 0,
  inited: false,
  needResize: false,
  baseUrl: null,
  playing: false,
  frameSlider: null,
  playPauseBtn: null,
  laodingImagePromises: [],
  init: function () {
    if (this.inited) {
      return;
    }
    this.inited = true;
    var resize = this.resize.bind(this);
    Split(['#thumnails', '#viewer'], {
        direction: 'horizontal',
        minSize: [260, 400],
        sizes: [20, 80],
        gutterSize: 0.01,
        onDrag: resize,
        onDragEnd: resize
    });
    $(window).resize(resize);

    //ImageViewer.setOperationMode(op);
    this.previewContainer = $('#preview-image');
    this.previewContainer.on('mousewheel', function (event) {
      event.preventDefault();
    });

    this.previewContainer.on("CornerstoneNewImage", this.onNewImage.bind(this));
    this.previewContainer.on("CornerstoneImageRendered", this.onImageRendered.bind(this));
    this.previewContainer.on("CornerstoneStackScroll", this.stopClip.bind(this));

    this.setupSlider();

    this.playPauseBtn = $('#play_pause_btn').button();
    this.playPauseBtn.bind('click', this.togglePlayPause.bind(this));

    $('#reset_btn').button().bind('click', this.resetViewport.bind(this));
  },
  setElementEnabled: function (enabled) {
    if (this.elementEnabled == enabled) {
      return;
    }
    var previewContainer = this.previewContainer[0];
    if (enabled) {
      this.elementEnabled = true;
      this.previewContainer.addClass('loading-finished');
      cornerstone.enable(previewContainer);

      cornerstoneTools.mouseInput.enable(previewContainer);
      cornerstoneTools.mouseWheelInput.enable(previewContainer);

      cornerstoneTools.stackScrollWheel.activate(previewContainer);
    } else {
      this.elementEnabled = false;
      this.previewContainer.removeClass('loading-finished');
      cornerstone.disable(previewContainer);

      cornerstoneTools.mouseInput.disable(previewContainer);
      cornerstoneTools.mouseWheelInput.disable(previewContainer);

      cornerstoneTools.stackScrollWheel.deactivate(previewContainer);
    }
  },
  resetViewport: function () {
    var previewContainer = this.previewContainer[0];
    var image = cornerstone.getImage(previewContainer);
    var viewport = cornerstone.getDefaultViewportForImage(previewContainer, image);
    cornerstone.setViewport(previewContainer, viewport);
  },
  stopClip: function () {
    if (!this.playing || !this.elementEnabled) {
      return;
    }
    this.playing = false;
    notifyPlayStatus(false);
    this.playPauseBtn.button("option", "label", "Play");
    cornerstoneTools.stopClip(this.previewContainer[0]);
  },
  playClip: function () {
    if (this.playing || !this.elementEnabled) {
      return;
    }
    if (this.activeSeriesIndex < 0 || this.activeSeriesIndex >= this.laodingImagePromises.length ||
        this.laodingImagePromises[this.activeSeriesIndex].state() !== 'resolved') {
      return;
    }
    this.playing = true;
    notifyPlayStatus(true);
    this.playPauseBtn.button( "option", "label", 'Pause');
    var fileIndex = this.currentStack.imageIdIndex2fileIndex[this.currentFrame];
    var frameTime = parseFloat(this.activeSeries.fileset[fileIndex].frameTime) || 66;
    cornerstoneTools.playClip(this.previewContainer[0], 1000 / frameTime);
  },
  togglePlayPause: function () {
    if (this.playing) {
      this.stopClip();
    } else {
      this.playClip();
    }
  },
  showPreviewDialog: function (series) {
    $('.study-preivew').show();
    ImageViewer.init();
    ImageViewer.setDicomSeries(series);
    ImageViewer.loadThumbnails();
    ImageViewer.resize();
  },
  setDicomSeries: function (series) {
    this.dicomSeries = series;
  },
  setBaseUrl: function (baseUrl) {
    this.baseUrl = baseUrl;
  },
  clearPreview: function () {
    var thumnails = $('#thumnails');
    thumnails.children().not(':first').remove();
    this.stopClip();
    this.setElementEnabled(false);
  },
  createThumbnailItem: function  (series, index) {
    var thumnails = $('#thumnails');
    var thumn = thumnails.children().first().clone();
    thumn.find('.series-number').html(series.seriesNumber);
    thumn.find('.dimension').html(series.rows +'x' + series.columns +'x' + series.fileset.length);
    thumn.find('.series-datetime').html(series.seriesDate + '-' + (series.seriesTime && series.seriesTime.substring(0, 6)));
    thumn.find('.series-description').html(series.seriesDescription);
    thumn.show();
    thumnails.append(thumn);
    var imageId = series.fileset[0].imageId;
    if (series.fileset[0].numberOfFrames > 1) {
      imageId += "?frame=0";
    }
    this.loadThumbnailImage(index, imageId, thumn.find('.image-container')[0]);
    thumn.bind('click', this.onClickThumbnail.bind(this, index, thumn, series));
    return thumn;
  },
  onClickThumbnail: function (index, thumb, series) {
    if (this.activeThumbnail != thumb) {
      if (this.activeThumbnail) {
        this.activeThumbnail.removeClass('active');
      }
      this.activeThumbnail = thumb;
      if (this.activeThumbnail) {
        this.activeThumbnail.addClass('active');
      }
      this.setSeriesActive(index, series);
    }
  },
  loadThumbnailImage: function (index, imageId, element) {
    cornerstone.enable(element);
    var promise = this.laodingImagePromises[index] = cornerstone.loadImage(imageId);
    promise.then(function(image) {
      $(element).addClass('loading-finished');
      var viewport = cornerstone.getDefaultViewportForImage(element, image);
      cornerstone.displayImage(element, image, viewport);
    })
    .fail(function (error) {
      console.log(error);
    });
  },
  loadThumbnails: function () {
    var dicomSeries = ImageViewer.dicomSeries;
    var sids = Object.keys(dicomSeries);
    sids.sort(function (a, b) {
      return dicomSeries[a].seriesNumber - dicomSeries[b].seriesNumber;
    });
    sids.forEach(function (sid, index) {
      var series = dicomSeries[sid];
      series.fileset = series.fileset.map(function (dicomFile) {
        if (dicomFile.imageId) {
          return dicomFile;
        } else if (!dicomFile.metadata) {
          var filename = (typeof dicomFile === 'string') ? dicomFile : dicomFile.filename;
          var numberOfFrames = dicomFile.numberOfFrames || 1;
          var imageId = 'wadouri:' + ImageViewer.baseUrl + filename + '?token=' + window.serverSid;
          return {
            filename: filename,
            imageId: imageId,
            numberOfFrames: numberOfFrames,
          }
        } else {
          var imageId = ImageViewer.addImageToLoader(dicomFile);
          dicomFile.imageId = imageId;
          return dicomFile;
        }
      });
      var thumb = ImageViewer.createThumbnailItem(series, index);
      if (index == 0) {
        thumb.trigger('click');
      }
    });
  },
  addImageToLoader: function  (dicomFile) {
    var byteArray = dicomFile.metadata._dataSet.byteArray;
    var blob = new Blob([ byteArray.buffer ]);
    return cornerstoneWADOImageLoader.fileManager.add(blob);
  },
  resize: function () {
    if (ImageViewer.needResize) {
      return;
    }
    this.needResize = true;
    setTimeout(function () {
      if (!ImageViewer.needResize) {
        return;
      }
      ImageViewer.needResize = false;
      var containers = $('#thumnails .image-container');
      var height = $('#thumnails').width() * 3 / 4;
      containers = [].slice.call(containers);
      for (var i = 1; i < containers.length; ++i) {
        containers[i].style.height = height + 'px';
        cornerstone.resize(containers[i], true);
      }
      if (ImageViewer.elementEnabled) {
        cornerstone.resize(ImageViewer.previewContainer[0], true);
      }
    }, 10);
  },
  currentStack: null,
  setSeriesActive: function (index, series) {
    if (this.activeSeries == series) {
      return;
    }
    if (this.activeSeries != null) {
      this.stopClip();
    }
    this.activeSeries = series;
    this.activeSeriesIndex = index;
    this.currentFrame = 0;
    var enabled = this.elementEnabled;
    var previewContainer = this.previewContainer[0];
    var previousViewport = null;
    if (enabled) {
      previousViewport = cornerstone.getViewport(previewContainer);
      this.setElementEnabled(false);
    }
    if (series == null) {
      return;
    }
    function getImageIds(series) {
      var ids = [];
      var imageIdIndex2fileIndex = [];
      series.fileset.forEach(function (f, fileIndex) {
        var num = parseInt(f.numberOfFrames);
        if (isNaN(num) || num === 1) {
          ids.push(f.imageId);
          imageIdIndex2fileIndex.push(fileIndex);
        } else {
          for (var i = 0; i < num; ++i) {
            ids.push(f.imageId+"?frame="+i);
            imageIdIndex2fileIndex.push(fileIndex);
          }
        }
      });
      return [ids, imageIdIndex2fileIndex];
    }
    var ids = getImageIds(series);
    var imageIds = ids[0];
    var imageIdIndex2fileIndex = ids[1];
    var currentStack = this.currentStack = {
      seriesDescription: series.seriesDescription,
      stackId : series.seriesNumber,
      imageIds: imageIds,
      imageIdIndex2fileIndex: imageIdIndex2fileIndex,
      // seriesIndex : seriesIndex,
      currentImageIdIndex: 0,
      // frameRate: series.frameRate
    }
    this.frameSlider.slider('option', 'max', currentStack.imageIds.length);
    this.frameSlider.slider('value', 0);

    var imageId = currentStack.imageIds[this.currentFrame];
    var autoPlay = series.modality === 'XA';
    this.laodingImagePromises[index].then(function(image) {
      if (ImageViewer.currentStack != currentStack) {
        return;
      }

      ImageViewer.setElementEnabled(true);

      var viewport = cornerstone.getDefaultViewportForImage(previewContainer, image);
      if (previousViewport && previousViewport.voi) {
        viewport.voi = previousViewport.voi;
      }

      cornerstone.displayImage(previewContainer, image, viewport);

      cornerstoneTools.addStackStateManager(previewContainer);
      cornerstoneTools.addToolState(previewContainer, 'stack', currentStack);

      ImageViewer.setOperationMode('window');

      if (autoPlay) {
        ImageViewer.playClip();
      }
    })
    .fail(function (error) {
      console.log(error);
    });
  },
  setupSlider: function (val) {
    this.frameSlider = $('#frame-slider');
    this.frameSlider.slider({
      min: 1,
      max: 1,
      range: "min",
      value: "1",
      slide: function( event, ui ) {
        var current = ui.value - 1;
        cornerstoneTools.scrollToIndex(ImageViewer.previewContainer[0], current);
      }
    });
  },
  operationMode: null,
  setOperationMode: function (op) {
    var element = this.previewContainer[0];
    if (op === 'window') {
      cornerstoneTools.wwwc.activate(element, 1);
    } else {
      cornerstoneTools.wwwc.deactivate(element, 1);
    }
    if (op === 'pan') {
      cornerstoneTools.pan.activate(element, 1);
    } else {
      cornerstoneTools.pan.deactivate(element, 1);
    }
    if (op === 'zoom') {
      cornerstoneTools.zoom.activate(element, 1);
    } else {
      cornerstoneTools.zoom.deactivate(element, 1);
    }
  },
  onNewImage: function (e) {
    $('#frame-slider').slider('value', this.currentStack.currentImageIdIndex + 1);
    $('#bottomRight1').text("Image #" + (this.currentStack.currentImageIdIndex + 1) + "/" + this.currentStack.imageIds.length);
  },
  onImageRendered: function (e, data) {
    $('#bottomRight2').text("Zoom:" + data.viewport.scale.toFixed(2));
    $('#bottomRight3').text("WW/WL:" + Math.round(data.viewport.voi.windowWidth) + "/" + Math.round(data.viewport.voi.windowCenter));
    $('#bottomRight4').text("Render Time:" + data.renderTimeInMs + " ms");
  }
};
window.ImageViewer = ImageViewer;
