function nextVideo() {
  const story = StoryData[currentStoryIndex];
  currentVideoIndex = (currentVideoIndex + 1) % story.videos.length;
  updateVideo();
}
function prevVideo() {
  const story = StoryData[currentStoryIndex];
  currentVideoIndex = (currentVideoIndex - 1 + story.videos.length) % story.videos.length;
  updateVideo();
}
function updateVideo() {
  const videoData = StoryData[currentStoryIndex].videos[currentVideoIndex];
  document.getElementById("storyVideo").src = videoData.url;
  document.getElementById("episodeLabel").textContent = videoData.episode;
}
