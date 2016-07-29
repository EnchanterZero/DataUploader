
import ImageSeries from './ImageSeries';
import ImageFrame from './ImageFrame';

class Parser {

  getSeries() {
    const series = new ImageSeries();
    series.seriesInstanceUID = this.seriesInstanceUID();
    series.seriesNumber = this.seriesNumber();
    series.seriesDate = this.seriesDate();
    series.seriesTime = this.seriesTime();
    series.seriesDescription = this.seriesDescription();
    series.modality = this.modality();
    series.bodyPartExamined = this.bodyPartExamined();
    series.rows = this.rows();
    series.columns = this.columns();
    series.frameTime = this.frameTime();
    series.numberOfChannels = this.numberOfChannels();

    const frameCount = this.numberOfFrames();
    for (let i = 0; i < frameCount; ++i) {
      series.frames.push(this.getFrame(i));
    }
    return series;
  }

  getFrame(frameIndex) {
    const frame = new ImageFrame();
    frame.sopInstanceUID = this.sopInstanceUID();
    frame.rows = this.rows(frameIndex);
    frame.columns = this.columns(frameIndex);
    frame.instanceNumber = this.instanceNumber(frameIndex);
    frame.pixelType = this.pixelType(frameIndex);
    frame.pixelSpacing = this.pixelSpacing(frameIndex);
    frame.pixelAspectRatio = this.pixelAspectRatio(frameIndex);
    frame.pixelData = this.pixelData(frameIndex);
    frame.windowCenter = this.windowCenter(frameIndex);
    frame.windowWidth = this.windowWidth(frameIndex);
    frame.rescaleSlope = this.rescaleSlope(frameIndex);
    frame.rescaleIntercept = this.rescaleIntercept(frameIndex);
    frame.bitsAllocated = this.bitsAllocated(frameIndex);
    return frame;
  }

}

export default Parser;
