class Template {
  /**
   * Set the configuration of the template.
   * This is going to the dynamic part of the visualizer and
   * the user can change the values.
   * @param configuration
   */
  setConfiguration(configuration) {
    console.log("loading configuration");
    console.log(configuration, "Template configuration has been registered.");
    this.configuration = configuration;
  }
}

export default Template;
