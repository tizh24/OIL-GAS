export const success = (res, message, data = null) => {
    return res.json({
        success: true,
        message,
        data
    });
};

export const error = (res, status, message, details = null) => {
    const response = {
        success: false,
        message
    };

    // Add details in development mode
    if (process.env.NODE_ENV !== 'production' && details) {
        response.error = details;
    }

    return res.status(status).json(response);
};
