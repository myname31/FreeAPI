// Function untuk menu Stalker
exports.getStalkerMenu = function() {
  return {
    status: true,
    message: "Stalker Endpoints",
    endpoints: {
      "Mobile Legends": "/api/stalk/ml?userId=12345678&serverId=1234"
    }
  };
};

// Function untuk menu Search
exports.getSearchMenu = function() {
  return {
    status: true,
    message: "Search Endpoints",
    endpoints: {
      "Pinterest": "/api/search/pinterest?query=anime"
    }
  };
};

// Function untuk menu Music
exports.getMusicMenu = function() {
  return {
    status: true,
    message: "Music Endpoints",
    endpoints: {
      "YT Music Search": "/api/ytmusic/search?query=Jatuh%20Suka%20Tulus",
      "YT Music Lyrics": "/api/ytmusic/lyrics?videoId=abc123xyz"
    }
  };
};

// Function untuk menu Genius
exports.getGeniusMenu = function() {
  return {
    status: true,
    message: "Genius Endpoints",
    endpoints: {
      "Genius Search": "/api/genius/search?query=Pesan%20Terakhir%20Lydora",
      "Genius Song Detail": "/api/genius/detail?id=7021148"
    }
  };
};
