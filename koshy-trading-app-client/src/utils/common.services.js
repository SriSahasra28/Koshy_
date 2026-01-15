export class DataLoadingServices {
  static isDataForMainChartIsLoading = true;
  static isDataForSecondaryChartIsLoading = true;
  static isDataForTableIsLoading = true;

  static homepageLoaders = {
    dataTableLoader: false,

    showDataTableLoader: () => {
      this.homepageLoaders.dataTableLoader = true;

      const loadingContainer = document.querySelector(
        "#homepage-data-table-loader"
      );

      if (loadingContainer) {
        loadingContainer.classList.remove("display-none");
      }
    },

    hideDataTableLoader: () => {
      this.homepageLoaders.dataTableLoader = false;

      const loadingContainer = document.querySelector(
        "#homepage-data-table-loader"
      );

      if (loadingContainer) {
        loadingContainer.classList.add("display-none");
      }
    },
  };

  static startLoadingForMainChart = () => {
    this.isDataForMainChartIsLoading = true;

    const loadingContainer = document.querySelector(
      ".loading-container-for-top-chart"
    );
    const chartContainer = document.querySelector("#main-chart-element");
    if (loadingContainer) {
      loadingContainer.classList.remove("display-none");
    }

    if (chartContainer) chartContainer.classList.add("display-none");
  };

  static stopLoadingForMainChart = () => {
    this.isDataForMainChartIsLoading = false;

    const loadingContainer = document.querySelector(
      ".loading-container-for-top-chart"
    );
    const chartContainer = document.querySelector("#main-chart-element");
    if (loadingContainer) {
      loadingContainer.classList.add("display-none");
    }

    if (chartContainer) chartContainer.classList.remove("display-none");
  };

  static startLoadingForSecondaryChart = () => {
    this.isDataForSecondaryChartIsLoading = true;

    const loadingContainer = document.querySelector(
      ".loading-container-for-bottom-chart"
    );
    const chartContainer = document.querySelector("#secondary-chart-element");
    if (loadingContainer) {
      loadingContainer.classList.remove("display-none");
    }

    if (chartContainer) chartContainer.classList.add("display-none");
  };

  static stopLoadingForSecondaryChart = () => {
    this.isDataForSecondaryChartIsLoading = true;

    const loadingContainer = document.querySelector(
      ".loading-container-for-bottom-chart"
    );
    const chartContainer = document.querySelector("#secondary-chart-element");
    if (loadingContainer) {
      loadingContainer.classList.add("display-none");
    }

    if (chartContainer) chartContainer.classList.remove("display-none");
  };

  static startLoadingForTable = () => {
    this.isDataForTableIsLoading = true;

    const loadingContainer = document.querySelector(
      ".loading-container-for-table-data"
    );
    const dataContainer = document.querySelector(".homepage-table-container");
    if (loadingContainer) {
      loadingContainer.classList.remove("display-none");
    }

    if (dataContainer) dataContainer.classList.add("display-none");
  };

  static stopLoadingForTable = () => {
    this.isDataForTableIsLoading = true;

    const loadingContainer = document.querySelector(
      ".loading-container-for-table-data"
    );
    const dataContainer = document.querySelector(".homepage-table-container");
    if (loadingContainer) {
      loadingContainer.classList.add("display-none");
    }

    if (dataContainer) dataContainer.classList.remove("display-none");
  };
}
