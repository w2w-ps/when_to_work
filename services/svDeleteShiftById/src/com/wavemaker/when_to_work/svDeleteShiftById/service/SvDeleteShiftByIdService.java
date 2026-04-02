package com.wavemaker.when_to_work.svDeleteShiftById.service;


import com.wavemaker.when_to_work.svDeleteShiftById.model.*;
import com.wavemaker.when_to_work.svDeleteShiftById.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface SvDeleteShiftByIdService {

  /**
   * 
   * 
    * @param id  (required)
   * @return RootResponse
   */
  @RequestLine("DELETE /scheduling/shifts/{id}")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",  })
  RootResponse invoke(@Param("id") String id);

}
