export function getUploads(req, res) {

    res.json({

        items: [

        { id: "CAM-082", location: "Sector 7G - Perimeter", time: "2024-05-12 14:30:22", duration: "04:12:00", status: "Indexed" },
        { id: "CAM-114", location: "Sub-Level 2 Parking", time: "2024-05-12 10:15:00", duration: "02:45:30", status: "Processing" },
        { id: "UNKNOWN", location: "Corrupt Header", time: "--", duration: "--", status: "Error" },

        ],

    });

}

export function createUpload(req, res) {

    const item = {

        id:
            req.body?.id ||
            `CAM-${Math.floor(100 + Math.random() * 900)}`,

        location:
            req.body?.location || "New Ingest",

        time: new Date().toISOString(),

        duration:
            req.body?.duration || "00:00:00",

        status: "Queued",

    };

    res.status(201).json({

        success: true,

        item,

    });

}