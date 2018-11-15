window.Term_Project = window.classes.Term_Project =
class Term_Project extends Scene_Component
{ 
  constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
  { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
    if( !context.globals.has_controls   ) 
      context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

    // Initial Camera Position
    context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
    this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

    const r = context.width/context.height;
    context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );


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
                      closedCone:     new Closed_Cone(10, 10),
                      cappedCylinder: new Capped_Cylinder(10, 10),
                      axis:           new Axis_Arrows()  
                   }
    this.submit_shapes( context, shapes );


    // Available Materials
    this.materials =
                    { 
                      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ) // Parameters: shader, color, ambient, diffusivity, specularity, smoothnes
                    }


    // Available Lights
    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

  }


  // Returns a chosen color with the specified opacity (0.0 - 1.0)
  // If color is not found, returns white
  // If opacity is not of range, returns opaque (opacity = 1.0)
  basicColors(color, opacity)
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
    /* FOR REFERENCE
    this.key_triggered_button( "Change Colors", [ "c" ], this.set_colors );    // Add a button for controlling the scene.


    this.key_triggered_button( "Outline",[ "o" ], () => {
                                                          this.outline = !this.outline
                                                        } )
      
    this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
    */
  }


  display( graphics_state )
  { 
    graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

    this.shapes.axis.draw( graphics_state, Mat4.identity(), this.materials.phong.override( {color: this.basicColors('cyan', 0.7) }) );


    /* REFERENCE
    // Setup Sun Light
    let sunLight  = [ new Light ( Vec.of( 0,0,0,1 ), Color.of(sunColorRed, 0, sunColorBlue, 1), 10 ** sunScale) ]
    graphics_state.lights = sunLight

    this.shapes.sphere.draw(graphics_state, planet, this.materials.planet.override( {color: Color.of(0.2, 1, 0.5, 1), specularity: 1, diffusivity: 0.2, gouraud: 1} ))

    this.initial_camera_location = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ).map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.1 ) )
    */

  }

}


window.bird = window.classes.bird =
class bird extends Shape
{
    
}