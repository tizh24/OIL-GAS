export const success = (res, message, data = null) => {
    return res.json({
        success: true,
        message,
        data
    });
};

export const error = (res, status, message) => {
    return res.status(status).json({
        success: false,
        message
    });
};
