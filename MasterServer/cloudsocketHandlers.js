const {discover,getInfo,control,statuscheck}= require("./server");

const setupSocketHandlers = (socket, socketEvents) => {
    socket.on(socketEvents.DISCOVER_DEVICES, () => {
        console.log(`[INFO] DISCOVER_DEVICES event received from client: ${socket.id}`);
        discover();
    });

    socket.on(socketEvents.GET_PIN_STATUS, ({ id, pin_no }) => {
        const room = `pin-status-check-${id}`;
        console.log(`[INFO] GET_PIN_STATUS event received from client: ${socket.id}`);
        statuscheck(id, pin_no);
    });

    socket.on(socketEvents.GET_DEVICE_INFO, ({ id }) => {
        const room = `device-info-${id}`;
        console.log(`[INFO] GET_DEVICE_INFO event received from client: ${socket.id}`);
        getInfo(id);
    });

    socket.on(socketEvents.CONTROL_DEVICE, ({ id, pin_no, state }) => {
        const room = `device-ack-${id}`;
        console.log(`[INFO] CONTROL_DEVICE event received from client: ${socket.id}`);
        control(id, pin_no, state);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
};

module.exports = setupSocketHandlers;
