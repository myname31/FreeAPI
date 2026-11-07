const REGION_MAP = {
  "1":"Indonesia","2":"Indonesia","3":"Indonesia","4":"Indonesia",
  "5":"Indonesia","6":"Indonesia","7":"Indonesia","8":"Indonesia","9":"Indonesia",
  "10":"Malaysia / SG / BN","11":"Philippines","12":"Thailand",
  "13":"Vietnam","14":"Cambodia","15":"Myanmar","16":"Laos",
  "17":"Timor-Leste","19":"Middle East","20":"North America",
  "21":"Europe","22":"South America",
};

function getRegion(sid) {
  const s = String(sid);
  return REGION_MAP[s.slice(0, 2)] ?? REGION_MAP[s.slice(0, 1)] ?? "Unknown";
}

async function stalkML(userId, serverId) {
  try {
    const res = await fetch(
      `https://api.isan.eu.org/nickname/ml?id=${userId}&server=${serverId}`,
      { headers: { "User-Agent": "StalkML/1.0", "Accept": "application/json" } }
    );

    const json = await res.json();

    if (json.success) {
      return {
        status: "success",
        code: 200,
        data: {
          id: userId,
          server: serverId,
          username: json.name,
          region: getRegion(serverId),
        }
      };
    } else {
      return {
        status: "failed",
        code: 404,
        data: {
          id: userId,
          server: serverId,
          username: "Not Found",
          region: getRegion(serverId),
        }
      };
    }
  } catch (e) {
    return {
      status: "error",
      code: 500,
      message: e.message
    };
  }
}

// Export fungsi agar bisa dipanggil di file lain
module.exports = { stalkML };
