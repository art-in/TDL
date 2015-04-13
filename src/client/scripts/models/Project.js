define(['lib/helpers'], function(helpers) {
   
   /**
    * Represents project - thematic group of tasks with concreete goal,
    * not necessarily defined work scope, and usually long execution time.
    * 
    * @constructor
    */
   function Project () {
      this.id = helpers.uid();
      this.name = '';
      
      /** 
       * Array of tags that can be used in task descriptions,
       * to associate them with this project
       */
      this.tags = []; // RGB strings ['#FF7700']
      
      /** Color for visual indication of the project */
      this.color = '';
   }
   
   return Project;
});