window.Term_Project = window.classes.Term_Project =
class Term_Project extends Scene_Component
{ 
  constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
  { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
    if( !context.globals.has_controls   ) 
      context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

    // Initial Camera Position
    context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,25 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
    this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

    const r = context.width/context.height;
    context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
    //context.globals.graphics_state.projection_transform = Mat4.orthographic()   // Orthographic camera??  DELETE

    // Available Shapes
    const shapes = {
                      triangle:       new Triangle(),
                      square:         new Square(),
                      tetrahedron:    new Tetrahedron(),
                      windmill:       new Windmill(),
                      cube:           new Cube(),
                      cubeOuline:     new Cube_Outline(),
                      line:           new Line_Segment_Array(),
                      sphere:         new Subdivision_Sphere(4),
                      gridSphere:     new Grid_Sphere(10, 10),
                      //grid:           new Grid_Patch(10, 10),
                      torus:          new Torus(),
                      closedCone:     new Closed_Cone(30, 30),
                      cappedCylinder: new Capped_Cylinder(30, 30),
                      roundedCylinder:new Rounded_Capped_Cylinder(30, 30),
                      axis:           new Axis_Arrows()  
                   }
    this.submit_shapes( context, shapes );


    // Available Materials
    this.materials =
                    { 
                      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ), // Parameters: shader, color, ambient, diffusivity, specularity, smoothnes
                      bird: context.get_instance( Phong_Shader ).material( this.basicColors('yellow') ),
                      pipe: context.get_instance( Phong_Shader ).material( this.basicColors('green') )
                    }


    // Available Lights
    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];


    // Class Variables
    this.showBoundaries = false // DELETE
    this.maxHeight = 10
    this.maxWidth = 18
    this.birdPositionOriginal = this.birdPosition = Mat4.identity().times(Mat4.rotation(Math.PI/2, [0, 1, 0]))
    this.pipePositionOriginal = this.pipePosition = Mat4.identity().times(Mat4.translation([this.maxWidth, -1 * this.maxHeight/2, 0])).times(Mat4.scale([1, this.maxHeight, 1])).times(Mat4.rotation(Math.PI/2, [1, 0, 0]))

  }


  // Returns a chosen color with the specified opacity (0.0 - 1.0)
  // If color is not found, returns white
  // If opacity is not of range, returns opaque (opacity = 1.0)
  basicColors(color, opacity = 1)
  {
    if(opacity < 0.0 || opacity > 1.0)
      opacity = 1.0

    switch (color)
    {
      case 'red':     return Color.of(1, 0, 0, opacity)
      case 'green':   return Color.of(0, 1, 0, opacity)
      case 'blue':    return Color.of(0, 0, 1, opacity)
      case 'yellow':  return Color.of(1, 1, 0, opacity)
      case 'cyan':    return Color.of(0, 1, 1, opacity)
      case 'magenta': return Color.of(1, 0, 1, opacity)
      case 'gray':    return Color.of(0.5, 0.5, 0.5, opacity)
      case 'maroon':  return Color.of(0.5, 0, 0, opacity)
      case 'purple':  return Color.of(0.5, 0, 0.5, opacity)
      case 'black':   return Color.of(0, 0, 0, opacity)
      case 'white':   return Color.of(1, 1, 1, opacity)

      default:      return Color.of(1, 1, 1, 1)
    }
  }


  make_control_panel()
  { 
    this.key_triggered_button( "Move up",         [ "i" ], () => { this.moveBird('up') } );
    this.key_triggered_button( "Move down",       [ "k" ], () => { this.moveBird('down') } );
    this.new_line();
    this.key_triggered_button( "Show Boundaries", [ "b" ], () => { this.showBoundaries = !this.showBoundaries } );     // DELETE

    /* FOR REFERENCE
    this.key_triggered_button( "Change Colors", [ "c" ], this.set_colors );    // Add a button for controlling the scene.


    this.key_triggered_button( "Outline",[ "o" ], () => {
                                                          this.outline = !this.outline
                                                        } )
      
    this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
    */
  }


  // Moves the bird in the desired direction (up, down)
  // Limits the movement to +- 10 from origin
  moveBird(direction)
  {
    switch(direction)
    {
      case 'up':
        this.birdPosition = this.birdPosition.times(Mat4.translation([0, 1, 0]))

        if ( this.birdPosition.equals(this.birdPositionOriginal.times(Mat4.translation([0, this.maxHeight, 0]))) )
          this.birdPosition = this.birdPositionOriginal.times(Mat4.translation([0, this.maxHeight - 1, 0]))
        break;


      case 'down':
        this.birdPosition = this.birdPosition.times(Mat4.translation([0, -1, 0]))

        if ( this.birdPosition.equals(this.birdPositionOriginal.times(Mat4.translation([0, -1 * this.maxHeight, 0]))) )
          this.birdPosition = this.birdPositionOriginal.times(Mat4.translation([0, -1 * this.maxHeight + 1, 0]))
        break;
    }
  
  }

  
  movePipe()
  {
    this.pipePosition = this.pipePosition.times(Mat4.translation([-0.5, 0, 0]))

    if ( this.pipePosition.equals(this.pipePositionOriginal.times(Mat4.translation([-2 * this.maxWidth - 2, 0, 0]))) )
          this.pipePosition = this.pipePositionOriginal
  }


  display( graphics_state )
  { 
    graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
    const FPS = 1 / dt  // Frames per second


    // Draw Bundaries - DELETE
    if (this.showBoundaries)
    {
      this.shapes.axis.draw( graphics_state, Mat4.identity(), this.materials.phong.override( {color: this.basicColors('cyan', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, -1 * this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([-1 * this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );
    }

    // Draws Bird
    this.shapes.closedCone.draw(graphics_state, this.birdPosition, this.materials.bird) 
    

    // Draw Pipe (Just one for now)
    this.movePipe()
    this.shapes.cappedCylinder.draw(graphics_state, this.pipePosition, this.materials.pipe)


    /* REFERENCE
    // Setup Sun Light
    let sunLight  = [ new Light ( Vec.of( 0,0,0,1 ), Color.of(sunColorRed, 0, sunColorBlue, 1), 10 ** sunScale) ]
    graphics_state.lights = sunLight

    this.shapes.sphere.draw(graphics_state, planet, this.materials.planet.override( {color: Color.of(0.2, 1, 0.5, 1), specularity: 1, diffusivity: 0.2, gouraud: 1} ))

    this.initial_camera_location = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ).map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.1 ) )
    */

  }

}