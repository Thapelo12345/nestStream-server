let isServerBusy = false;

const LockManager = {
  isBusy: () => isServerBusy,
  setBusy: (status: boolean) => {
    isServerBusy = status;
  }
};

export = LockManager;
