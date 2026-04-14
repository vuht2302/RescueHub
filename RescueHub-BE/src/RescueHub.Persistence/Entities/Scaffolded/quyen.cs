using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class quyen
{
    public Guid id { get; set; }

    public string module_code { get; set; } = null!;

    public string action_code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<vai_tro_quyen> vai_tro_quyens { get; set; } = new List<vai_tro_quyen>();
}
