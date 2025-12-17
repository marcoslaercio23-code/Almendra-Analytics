import { toast } from 'react-toastify';

export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const showError = (message, options = {}) => {
  return toast.error(message, {
    position: 'bottom-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  return toast.warning(message, {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  return toast.info(message, {
    position: 'bottom-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'bottom-right',
  });
};

export const updateToast = (toastId, content) => {
  toast.update(toastId, content);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  update: updateToast,
  dismiss: dismissToast,
};
