using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class item_category
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public virtual ICollection<item> items { get; set; } = new List<item>();
}
