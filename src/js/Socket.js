let payload = {
  type: "VISUALIZER_CLIENT",
};
let ws = null;
try {
  ws = new WebSocket("ws://localhost:8080/ws");
} catch (err) {
  console.error(err);
}
let key = "";
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charactersLength = characters.length;
for (let i = 0; i < 32; i++) {
  key += characters.charAt(Math.floor(Math.random() * charactersLength));
}
// @todo generate real key
key = characters;
export default {
  start: function () {
    ws.onopen = function () {
      if (window.location.search.includes("disablesocket") === false) {
        ws.send(
          JSON.stringify({
            state: "REGISTERING_CLIENT",
            data: {
              key: key,
            },
          })
        );
      }
    };
    ws.onmessage = function (event) {
      console.log(event.data);
      let message = JSON.parse(event.data);
      if (message.state === "BROADCAST") {
      }
    };
  },
  send: function (message) {
    ws.send(JSON.stringify(message));
  },
  startRecording(file) {
    if (file === null) {
      return null;
    }
    this.send({ state: "BROADCAST", data: { key: key, action: "record" } });

    let reader = new FileReader();
    let rawData = new ArrayBuffer();
    reader.onload = function (e) {
      rawData = e.target.result;
      ws.send(
        JSON.stringify({
          state: "BROADCAST",
          data: {
            key: key,
            action: "UPLOAD_DATA",
            sound: {
              file: { name: file.name },
              data: new Uint8Array(rawData),
            },
          },
        })
      );
    }.bind(this);
    reader.readAsArrayBuffer(file);
  },
};
